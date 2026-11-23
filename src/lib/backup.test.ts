import { describe, expect, it } from 'vitest'
import { accounts, lessons } from '../data'
import { exportBackup, importBackup, validateState } from './backup'
import { advance, createDraft, initialState, recordAnswer, setResponse } from './study'
import { correctResponse } from '../test/answers'
function fixture() {
  let state = structuredClone(initialState)
  state.draft = createDraft('test', 1, lessons[0].questions, true)
  for (const q of lessons[0].questions) state = advance(recordAnswer(setResponse(state, correctResponse(q)), q))
  state.notes[lessons[0].sections[0].id] = '借方は左。負債の増加は右。'
  state.readSections = [lessons[0].sections[0].id]
  state.draft = createDraft('test', 3, lessons[2].questions, true)
  state.draft.response.lines[0].accountId = 'cash'
  state.draft.response.lines[0].amount = '１０，０００'
  return state
}
describe('バックアップの検証', () => {
  it('履歴、メモ、途中回答、選択肢順を往復保存する', () => {
    const state = fixture()
    expect(importBackup(exportBackup(state), lessons, accounts)).toEqual(state)
  })
  it.each(['app', 'formatVersion', 'contentVersion'])('異なる%sを拒否する', key => {
    const data = JSON.parse(exportBackup(fixture()))
    data[key] = key === 'formatVersion' ? 99 : 'other-app'
    expect(() => importBackup(JSON.stringify(data), lessons, accounts)).toThrow()
  })
  it('未登録ID、不正位置、偽の採点、選択肢の重複を拒否し、元の状態を変えない', () => {
    const original = fixture()
    const mutations = [
      (s: typeof original) => { s.notes.missing = 'メモ' },
      (s: typeof original) => { s.readSections.push('unknown') },
      (s: typeof original) => { s.positions[lessons[0].id] = 100 },
      (s: typeof original) => { s.draft!.questionIds[0] = 'unknown' },
      (s: typeof original) => { s.draft!.index = 100 },
      (s: typeof original) => { s.draft!.response.lines[0].accountId = 'unknown' },
      (s: typeof original) => { s.attempts[0].answers[0].correct = false },
      (s: typeof original) => { s.lastAttemptId = 'unknown' },
      (s: typeof original) => { const key = Object.keys(s.draft!.choiceOrder)[0]; s.draft!.choiceOrder[key].fill('unknown') }
    ]
    for (const mutate of mutations) {
      const state = structuredClone(original)
      mutate(state)
      expect(() => importBackup(exportBackup(state), lessons, accounts)).toThrow()
    }
    expect(original.notes[lessons[0].sections[0].id]).toContain('借方')
    expect(() => validateState(original, lessons, accounts)).not.toThrow()
  })
  it('不正JSONと上限を超えるファイルを拒否する', () => {
    expect(() => importBackup('{', lessons, accounts)).toThrow()
    expect(() => importBackup(' '.repeat(20 * 1024 * 1024 + 1), lessons, accounts)).toThrow('20MB')
  })
})
