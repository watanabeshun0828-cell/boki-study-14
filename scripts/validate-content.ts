import { readdir, readFile } from 'node:fs/promises'
import { z } from 'zod'
import { accountSchema, lessonSchema, scenarioSchema, sourceSchema } from '../src/lib/schema.ts'
import { auditScenario, calculate, totals } from '../src/lib/accounting.ts'

const root = new URL('../src/data/', import.meta.url)
const read = async (name: string) => JSON.parse(await readFile(new URL(name, root), 'utf8'))
const accounts = z.array(accountSchema).parse(await read('accounts.json'))
const sources = z.array(sourceSchema).parse(await read('sources.json'))
const scenario = scenarioSchema.parse(await read('scenario.json'))
const files = (await readdir(root)).filter(name => /^day\d{2}\.json$/.test(name)).sort()
const lessons = await Promise.all(files.map(async file => lessonSchema.parse(await read(file))))
const glossary = z.array(z.object({ id: z.string().min(1), term: z.string().min(1), description: z.string().min(1), referenceIds: z.array(z.string()).min(1) })).parse(await read('glossary.json'))
const questions = lessons.flatMap(lesson => lesson.questions)
const knownAccounts = new Set(accounts.map(account => account.id))
const knownSources = new Set(sources.map(source => source.id))
const allIds = [...accounts.map(a => a.id), ...sources.map(s => s.id), ...lessons.map(l => l.id),
  ...lessons.flatMap(l => l.sections.map(s => s.id)), ...questions.map(q => q.id)]
allIds.push(...glossary.map(term => term.id), ...scenario.transactions.map(item => item.id))
if (new Set(allIds).size !== allIds.length) throw new Error('IDが重複しています。')
if (lessons.length !== 14 || lessons.some((lesson, index) => lesson.day !== index + 1 ||
  lesson.questions.length !== (lesson.day === 14 ? 16 : 8))) throw new Error('14日・各8問／最終16問の構成を確認してください。')
function checkReferences(ids: string[]) {
  if (ids.some(id => !knownSources.has(id))) throw new Error('未登録の出典IDがあります。')
}
glossary.forEach(term => checkReferences(term.referenceIds))
if (new Set(questions.map(question => question.prompt)).size !== questions.length) throw new Error('同じ設問の重複があります。')
accounts.forEach(account => checkReferences(account.referenceIds))
for (const lesson of lessons) {
  checkReferences(lesson.referenceIds)
  const knownSections = new Set(lesson.sections.map(section => section.id))
  lesson.sections.forEach(section => {
    checkReferences(section.referenceIds)
    if (section.example && totals(section.example).debit !== totals(section.example).credit) throw new Error('講義例の貸借が一致しません。')
    for (const entry of section.example ?? []) if (!knownAccounts.has(entry.accountId)) throw new Error('例示の科目IDがありません。')
  })
  for (const question of lesson.questions) {
    if (!knownSections.has(question.sectionId)) throw new Error('対応する章がありません。')
    checkReferences(question.referenceIds)
    for (const calculation of question.calculations) {
      if (calculate(calculation) !== calculation.result) throw new Error(`計算の不一致: ${question.id}`)
    }
    if (question.format === 'choice') {
      if (!question.choices.some(c => c.id === question.correctChoiceId) ||
        new Set(question.choices.map(c => c.id)).size !== 4 ||
        new Set(question.choices.map(c => c.text)).size !== 4) throw new Error('選択肢を確認してください。')
    } else if (!question.calculations.length) throw new Error('計算の記録がありません。')
    if (question.format === 'numeric') {
      if (new Set(question.fields.map(field => field.id)).size !== question.fields.length) throw new Error('入力欄IDが重複しています。')
      for (const field of question.fields) {
        if (question.calculations[field.calculationIndex]?.result !== field.expected) throw new Error(`数値解答と検算が一致しません: ${question.id}`)
      }
    }
    if (question.format === 'journal') {
      const sum = totals(question.expected)
      if (sum.debit !== sum.credit || question.expected.some(entry => !knownAccounts.has(entry.accountId))) throw new Error(`仕訳の整合性エラー: ${question.id}`)
    }
  }
}
checkReferences(scenario.referenceIds)
scenario.transactions.forEach(transaction => {
  checkReferences(transaction.referenceIds)
  if (transaction.entries.some(entry => !knownAccounts.has(entry.accountId))) throw new Error('総合設例の科目IDがありません。')
})
const result = auditScenario(scenario, accounts)
const counts = {
  journal: questions.filter(q => q.format === 'journal').length,
  numeric: questions.filter(q => q.format === 'numeric').length,
  choice: questions.filter(q => q.format === 'choice').length
}
if (counts.journal + counts.numeric < questions.length / 2) throw new Error('入力問題が半数未満です。')
const distribution = [0, 0, 0, 0]
questions.forEach(question => {
  if (question.format === 'choice') distribution[question.choices.findIndex(choice => choice.id === question.correctChoiceId)]++
})
if (Math.max(...distribution) - Math.min(...distribution) > 1) throw new Error('正答位置の偏りを確認してください。')
console.log(JSON.stringify({ days: lessons.length, questions: questions.length, counts, choicePositions: distribution, scenario: result }, null, 2))
