import type { Account, Calculation, Entry, Question, Scenario } from './schema'

export type InputLine = { side: Entry['side']; accountId: string; amount: string }
export type Response = { lines: InputLine[]; values: Record<string, string>; choiceId: string }
export const emptyResponse = (): Response => ({
  lines: [{ side: 'debit', accountId: '', amount: '' }, { side: 'credit', accountId: '', amount: '' }],
  values: {}, choiceId: ''
})
export function parseYen(input: string): number | null {
  const value = input.normalize('NFKC').trim().replace(/−/g, '-')
  if (!/^-?(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(value)) return null
  const amount = Number(value.replaceAll(',', ''))
  return Number.isSafeInteger(amount) && Math.abs(amount) <= 1_000_000_000 ? amount : null
}
export function totals(entries: Entry[]) {
  return entries.reduce((sum, entry) => ({ ...sum, [entry.side]: sum[entry.side] + entry.amount }), { debit: 0, credit: 0 })
}
export function calculate(calculation: Calculation): number {
  const values = calculation.operands
  let value: number
  switch (calculation.operator) {
    case 'sum': value = values.reduce((sum, item) => sum + item, 0); break
    case 'difference': value = values.slice(1).reduce((sum, item) => sum - item, values[0]); break
    case 'product': value = values.reduce((product, item) => product * item, 1); break
    case 'quotient': value = values.slice(1).reduce((quotient, item) => quotient / item, values[0]); break
    case 'depreciation': value = (values[0] - values[1]) * values[3] / (values[2] * 12); break
  }
  return calculation.rounding === '1円未満切り捨て' ? Math.floor(value) : value
}
export function readLines(lines: InputLine[]): Entry[] | null {
  const used = lines.filter(line => line.accountId || line.amount.trim())
  const entries: Entry[] = []
  for (const line of used) {
    const amount = parseYen(line.amount)
    if (!line.accountId || amount === null || amount <= 0) return null
    entries.push({ side: line.side, accountId: line.accountId, amount })
  }
  if (entries.length < 2) return null
  const identities = entries.map(entry => entry.side + ':' + entry.accountId)
  return new Set(identities).size === identities.length ? entries : null
}
const canonical = (entries: Entry[]) => entries.map(entry => `${entry.side}:${entry.accountId}:${entry.amount}`).sort().join('|')
export function assess(question: Question, response: Response): { ready: boolean; correct: boolean; message: string } {
  if (question.format === 'choice') {
    const ready = question.choices.some(choice => choice.id === response.choiceId)
    return { ready, correct: ready && response.choiceId === question.correctChoiceId, message: ready ? '' : '選択肢を選んでください。' }
  }
  if (question.format === 'numeric') {
    const ready = question.fields.every(field => parseYen(response.values[field.id] ?? '') !== null)
    const correct = ready && question.fields.every(field => parseYen(response.values[field.id]) === field.expected)
    return { ready, correct, message: ready ? '' : 'すべての金額を整数円で入力してください。' }
  }
  const entries = readLines(response.lines)
  if (!entries) return { ready: false, correct: false, message: '科目と正の整数円を入力してください。同じ側の同じ科目は1行にまとめます。' }
  const sum = totals(entries)
  return {
    ready: true, correct: sum.debit === sum.credit && canonical(entries) === canonical(question.expected),
    message: sum.debit === sum.credit ? '貸借合計は一致しています。科目と取引内容も確認して採点します。' : '貸借合計が一致していません。入力を見直すか、そのまま確定して解説を確認できます。'
  }
}
export function balances(entries: Entry[]) {
  const result = new Map<string, number>()
  for (const entry of entries) result.set(entry.accountId, (result.get(entry.accountId) ?? 0) + (entry.side === 'debit' ? entry.amount : -entry.amount))
  return result
}
export function trialBalance(entries: Entry[], accounts: Account[]) {
  const balance = balances(entries)
  return accounts.filter(account => balance.has(account.id)).map(account => {
    const amount = balance.get(account.id)!
    return { ...account, debit: Math.max(amount, 0), credit: Math.max(-amount, 0), net: amount }
  })
}
export function statements(entries: Entry[], accounts: Account[]) {
  const rows = trialBalance(entries, accounts)
  const sum = (types: Account['type'][]) => rows.filter(row => types.includes(row.type)).reduce((total, row) => total + row.net, 0)
  const assets = sum(['asset', 'contraAsset'])
  const liabilities = -sum(['liability'])
  const equityBeforeProfit = -sum(['equity'])
  const revenue = -sum(['revenue'])
  const expenses = sum(['expense'])
  const profit = revenue - expenses
  return { rows, assets, liabilities, equityBeforeProfit, revenue, expenses, profit, endingEquity: equityBeforeProfit + profit }
}
export function auditScenario(scenario: Scenario, accounts: Account[]) {
  for (const transaction of scenario.transactions) {
    const sum = totals(transaction.entries)
    if (sum.debit !== sum.credit) throw new Error(`仕訳の貸借不一致: ${transaction.id}`)
  }
  const unadjusted = scenario.transactions.filter(item => !item.adjustment).flatMap(item => item.entries)
  const adjusted = scenario.transactions.flatMap(item => item.entries)
  const before = trialBalance(unadjusted, accounts)
  const after = trialBalance(adjusted, accounts)
  const result = statements(adjusted, accounts)
  const actual = {
    unadjustedDebit: before.reduce((sum, row) => sum + row.debit, 0),
    unadjustedCredit: before.reduce((sum, row) => sum + row.credit, 0),
    adjustedDebit: after.reduce((sum, row) => sum + row.debit, 0),
    adjustedCredit: after.reduce((sum, row) => sum + row.credit, 0),
    assets: result.assets, liabilities: result.liabilities, revenue: result.revenue,
    expenses: result.expenses, profit: result.profit, endingEquity: result.endingEquity
  }
  for (const key of Object.keys(actual) as (keyof typeof actual)[]) {
    if (actual[key] !== scenario.expected[key]) throw new Error(`総合設例の検算不一致: ${key}`)
  }
  if (actual.assets !== actual.liabilities + actual.endingEquity ||
      actual.endingEquity - scenario.initialEquity !== actual.profit) throw new Error('利益と純資産の増減が一致しません。')
  return actual
}
