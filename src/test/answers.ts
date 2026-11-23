import { emptyResponse, type Response } from '../lib/accounting'
import type { Question } from '../lib/schema'
export function correctResponse(q: Question): Response {
  const response = emptyResponse()
  if (q.format === 'journal') response.lines = q.expected.map(e => ({ ...e, amount: String(e.amount) }))
  if (q.format === 'numeric') response.values = Object.fromEntries(q.fields.map(f => [f.id, String(f.expected)]))
  if (q.format === 'choice') response.choiceId = q.correctChoiceId
  return response
}
