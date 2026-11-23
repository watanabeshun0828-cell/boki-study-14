import { describe, expect, it } from 'vitest'
import { lessons, questions } from '../data'
import { emptyResponse } from './accounting'
import { advance, createDraft, dayComplete, initialState, migrateState, recordAnswer, setResponse } from './study'
import { correctResponse } from '../test/answers'
describe('学習の進行と復習', () => {
  it('未確定では進まず、重複確定を防ぎ、確定後の変更を防ぐ', () => {
    const lesson = lessons[2]
    let state = { ...structuredClone(initialState), draft: createDraft('test', 3, lesson.questions, true) }
    expect(advance(state)).toBe(state)
    expect(recordAnswer(state, lesson.questions[0])).toBe(state)
    state = setResponse(state, correctResponse(lesson.questions[0])) as typeof state
    state = recordAnswer(state, lesson.questions[0]) as typeof state
    expect(recordAnswer(state, lesson.questions[0])).toBe(state)
    expect(setResponse(state, emptyResponse())).toBe(state)
    state = advance(state) as typeof state
    expect(state.draft.index).toBe(1)
    expect(state.draft.response).toEqual(emptyResponse())
    expect(state.latestAnswers[lesson.questions[0].id].correct).toBe(true)
  })
  it('最新の不正解だけを復習対象にし、正解後は外す', () => {
    const question = questions.find(q => q.format === 'choice')!
    let state = { ...structuredClone(initialState), draft: createDraft('review', 1, [question], true) }
    const wrong = { ...emptyResponse(), choiceId: question.format === 'choice' ? question.choices.find(c => c.id !== question.correctChoiceId)!.id : '' }
    state = recordAnswer(setResponse(state, wrong), question) as typeof state
    expect(Object.values(state.latestAnswers).filter(a => !a.correct)).toHaveLength(1)
    const completed = advance(state)
    expect(completed.attempts).toHaveLength(1)
    let review = { ...completed, draft: createDraft('review', 1, [question], true) }
    review = recordAnswer(setResponse(review, correctResponse(question)), question) as typeof review
    expect(Object.values(review.latestAnswers).filter(a => !a.correct)).toHaveLength(0)
    expect(advance(review).attempts).toHaveLength(2)
  })
  it('通常練習完了と全節読了を達成条件にする', () => {
    const lesson = lessons[0]
    let state = { ...structuredClone(initialState), draft: createDraft('test', 1, lesson.questions, false) } as typeof initialState
    for (const question of lesson.questions) state = advance(recordAnswer(setResponse(state, correctResponse(question)), question))
    expect(state.attempts).toHaveLength(1)
    expect(advance(state)).toBe(state)
    expect(dayComplete(lesson, state)).toBe(false)
    expect(dayComplete(lesson, { ...state, readSections: lesson.sections.map(s => s.id) })).toBe(true)
  })
  it('内部試作版v1をv2へ移行し、IDと途中入力を保つ', () => {
    const state = { ...structuredClone(initialState), selectedDay: 3, readSections: [lessons[2].sections[0].id], draft: createDraft('test', 3, lessons[2].questions, true) }
    state.draft.response.lines[0] = { side: 'debit', accountId: 'cash', amount: '123' }
    const { notes: _notes, ...common } = state
    const result = migrateState({ ...common, version: 1 })
    expect(result).toEqual({ ...state, notes: {}, version: 2 })
    expect(() => migrateState({ ...state, version: 99 })).toThrow()
  })
})
