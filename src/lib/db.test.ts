import { expect, it } from 'vitest'
import { openDB, deleteDB } from 'idb'
import { DB_NAME, loadState, saveState } from './db'
import { initialState } from './study'
it('専用DBに順序通り保存し、他のアプリの記録を変更しない', async () => {
  await deleteDB(DB_NAME)
  const other = await openDB('fp-study-14-test-isolation', 1, { upgrade(db) { db.createObjectStore('state') } })
  await other.put('state', { marker: '保護するFPの記録' }, 'current')
  expect(await loadState()).toEqual(initialState)
  const first = { ...structuredClone(initialState), selectedDay: 2 }
  const final = { ...first, selectedDay: 14, notes: { 'boki-day01-s01': '保存の順番を確認' } }
  await Promise.all([saveState(first), saveState(final)])
  expect(await loadState()).toEqual(final)
  expect(await other.get('state', 'current')).toEqual({ marker: '保護するFPの記録' })
  other.close()
  await deleteDB('fp-study-14-test-isolation')
  await deleteDB(DB_NAME)
})
