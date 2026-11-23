import { describe, expect, it } from 'vitest'
import { accounts, lessons, questions, scenario } from '../data'
import { assess, auditScenario, balances, calculate, emptyResponse, parseYen, statements, totals } from './accounting'
import type { Question } from './schema'
const journal = questions.find((q): q is Extract<Question, { format: 'journal' }> => q.format === 'journal' && q.expected.length > 2)!
describe('仕訳と金額の採点', () => {
  it('複合仕訳を行順によらず採点し、未使用の空行を無視する', () => {
    const response = { ...emptyResponse(), lines: [...journal.expected].reverse().map(e => ({ ...e, amount: e.amount.toLocaleString('ja-JP') })) }
    response.lines.push({ side: 'debit', accountId: '', amount: '' })
    expect(assess(journal, response)).toMatchObject({ ready: true, correct: true })
    response.lines[0].accountId = 'cashOverShort'
    expect(assess(journal, response)).toMatchObject({ ready: true, correct: false })
  })
  it('借貸が等しくても科目・側・金額が違えば不正解にする', () => {
    const q = questions.find((q): q is Extract<Question, {format:'journal'}> => q.format === 'journal' && q.expected.length === 2)!
    const lines = q.expected.map(e => ({ ...e, amount: String(e.amount) }))
    expect(assess(q, { ...emptyResponse(), lines: lines.map(e => ({ ...e, side: e.side === 'debit' ? 'credit' : 'debit' })) }).correct).toBe(false)
    expect(assess(q, { ...emptyResponse(), lines: lines.map(e => ({ ...e, amount: String(Number(e.amount) + 1) })) }).correct).toBe(false)
    lines[0].amount = String(Number(lines[0].amount) + 1)
    expect(assess(q, { ...emptyResponse(), lines })).toMatchObject({ ready: true, correct: false })
  })
  it('半角・全角・桁区切りを受け入れ、少数・不正な桁区切り・非数を拒否する', () => {
    expect(parseYen(' １２，３４５ ')).toBe(12345)
    expect(parseYen('−４００')).toBe(-400)
    for (const value of ['', '1.2', '1e3', '12,34', 'Infinity', '1000000001', '10円']) expect(parseYen(value)).toBeNull()
    expect(parseYen('0')).toBe(0)
  })
  it('仕訳の未入力・ゼロ・同一側の科目重複は確定させない', () => {
    const response = { ...emptyResponse(), lines: journal.expected.map(e => ({ ...e, amount: String(e.amount) })) }
    response.lines[0].amount = ''
    expect(assess(journal, response).ready).toBe(false)
    response.lines[0].amount = '0'
    expect(assess(journal, response).ready).toBe(false)
    response.lines = journal.expected.map(e => ({ ...e, amount: String(e.amount) }))
    response.lines.push({ ...response.lines[0] })
    expect(assess(journal, response).ready).toBe(false)
  })
  it('選択肢を並べ替えても安定したIDで正解を判定する', () => {
    const q = questions.find((q): q is Extract<Question, {format:'choice'}> => q.format === 'choice')!
    expect(assess({ ...q, choices: [...q.choices].reverse() }, { ...emptyResponse(), choiceId: q.correctChoiceId }).correct).toBe(true)
  })
  it('全120問の正解入力を採点し、全計算の式・単位・端数処理を検算する', () => {
    expect(lessons.map(l => l.questions.length)).toEqual([...Array(13).fill(8), 16])
    for (const q of questions) {
      const response = emptyResponse()
      if (q.format === 'journal') response.lines = q.expected.map(e => ({ ...e, amount: String(e.amount) }))
      if (q.format === 'numeric') response.values = Object.fromEntries(q.fields.map(f => [f.id, String(f.expected)]))
      if (q.format === 'choice') response.choiceId = q.correctChoiceId
      expect(assess(q, response), q.id).toMatchObject({ ready: true, correct: true })
      for (const c of q.calculations) { expect(calculate(c), q.id).toBe(c.result); expect(c.unit).toBe('円') }
    }
    const fractional = questions.flatMap(q => q.calculations).find(c => c.rounding === '1円未満切り捨て')!
    expect(calculate(fractional)).toBe(8333)
  })
})
describe('取引・元帳・試算表・決算書の一貫性', () => {
  it('固定の期待残高・利益と、個々の仕訳から算出した金額が一致する', () => {
    expect(auditScenario(scenario, accounts)).toEqual({ unadjustedDebit: 530000, unadjustedCredit: 530000, adjustedDebit: 545200, adjustedCredit: 545200, assets: 399300, liabilities: 42000, revenue: 190000, expenses: 132700, profit: 57300, endingEquity: 357300 })
    const entries = scenario.transactions.flatMap(t => t.entries)
    const ledger = balances(entries)
    expect(ledger.get('bank')).toBe(165500)
    expect(ledger.get('cash')).toBe(81000)
    expect(ledger.get('receivable')).toBe(60000)
    expect(ledger.get('equipmentAccum')).toBe(-12000)
    const result = statements(entries, accounts)
    expect(result.assets).toBe(result.liabilities + result.endingEquity)
    expect(result.endingEquity - 300000).toBe(result.profit)
    for (const transaction of scenario.transactions) expect(totals(transaction.entries).debit).toBe(totals(transaction.entries).credit)
  })
  it('設例の不整合を見逃さない', () => {
    const broken = structuredClone(scenario)
    broken.transactions[0].entries[0].amount++
    expect(() => auditScenario(broken, accounts)).toThrow('貸借不一致')
    expect(() => auditScenario({ ...scenario, expected: { ...scenario.expected, assets: 419300 } }, accounts)).toThrow('検算不一致')
  })
})
