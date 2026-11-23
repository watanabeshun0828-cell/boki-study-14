import { z } from 'zod'

const text = z.string().trim().min(1)
export const yen = z.number().int().min(0).max(1_000_000_000)
export const sideSchema = z.enum(['debit', 'credit'])
export const entrySchema = z.object({ side: sideSchema, accountId: text, amount: yen.refine(value => value > 0) })
export const calculationSchema = z.object({
  expression: text, operator: z.enum(['sum', 'difference', 'product', 'quotient', 'depreciation']),
  operands: z.array(z.number().finite()).min(1), result: z.number().int(),
  unit: z.literal('円'), rounding: z.enum(['端数なし', '1円未満切り捨て'])
})
const common = z.object({
  id: text, sectionId: text, category: text, prompt: text, explanation: text,
  referenceIds: z.array(text).min(1), assumptions: text,
  calculations: z.array(calculationSchema),
  document: z.object({
    kind: z.enum(['receipt', 'invoice', 'memo']), number: text, date: text,
    issuer: text, recipient: text, description: text, amount: yen
  }).optional()
})
const journal = common.extend({ format: z.literal('journal'), expected: z.array(entrySchema).min(2).max(12) })
const numeric = common.extend({
  format: z.literal('numeric'),
  fields: z.array(z.object({ id: text, label: text, expected: z.number().int(), calculationIndex: z.number().int().min(0), unit: z.literal('円') })).min(1)
})
const choice = common.extend({
  format: z.literal('choice'),
  choices: z.array(z.object({ id: text, text })).length(4), correctChoiceId: text
})
export const questionSchema = z.discriminatedUnion('format', [journal, numeric, choice])
export const lessonSchema = z.object({
  schemaVersion: z.literal(1), id: text, day: z.number().int().min(1).max(14),
  title: text, category: text, referenceIds: z.array(text).min(1), goals: z.array(text).min(2),
  sections: z.array(z.object({
    id: text, title: text, paragraphs: z.array(text).min(1), keyPoint: text,
    referenceIds: z.array(text).min(1),
    example: z.array(entrySchema).optional(),
    diagram: z.object({ title: text, description: text, items: z.array(z.object({ label: text, detail: text })).min(2) }).optional()
  })).min(2).max(4),
  questions: z.array(questionSchema).min(8).max(16)
})
export const accountSchema = z.object({
  id: text, name: text, type: z.enum(['asset', 'contraAsset', 'liability', 'equity', 'revenue', 'expense', 'clearing']),
  description: text, referenceIds: z.array(text).min(1)
})
export const sourceSchema = z.object({
  id: text, title: text, url: z.string().url().nullable(), checkedAt: z.iso.date(),
  appliesTo: text, location: text, role: z.enum(['出題範囲', '事実の根拠', '技術仕様', '練習用の仮定']),
  notes: text
})
export const scenarioSchema = z.object({
  id: text, title: text, assumptions: z.array(text).min(1), referenceIds: z.array(text).min(1),
  initialEquity: yen,
  transactions: z.array(z.object({
    id: text, date: text, description: text, adjustment: z.boolean(), referenceIds: z.array(text).min(1),
    entries: z.array(entrySchema).min(2)
  })).min(1),
  expected: z.object({
    unadjustedDebit: yen, unadjustedCredit: yen, adjustedDebit: yen, adjustedCredit: yen,
    assets: yen, liabilities: yen, revenue: yen, expenses: yen, profit: z.number().int(), endingEquity: yen
  })
})
export type Entry = z.infer<typeof entrySchema>
export type Question = z.infer<typeof questionSchema>
export type Lesson = z.infer<typeof lessonSchema>
export type Account = z.infer<typeof accountSchema>
export type Scenario = z.infer<typeof scenarioSchema>
export type Calculation = z.infer<typeof calculationSchema>
