// node --test: unread counts (lib/reads.js) with a fake Supabase rpc
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { unreadCounts } from '../lib/reads.js'

const fakeDb = (answer) => {
  const calls = []
  return { calls, rpc: async (name, args) => { calls.push([name, args]); return typeof answer === 'function' ? answer() : answer } }
}

test('unreadCounts: one call for the threads on screen -> Map(thread -> {unread, firstUnread})', async () => {
  const db = fakeDb({ data: [{ thread_id: 1, unread: 2, first_unread: 41 }, { thread_id: 3, unread: 0, first_unread: null }], error: null })
  const m = await unreadCounts(db, 'u1', [1, 2, 3])
  assert.deepEqual(db.calls, [['unread_counts', { p_user: 'u1', p_threads: [1, 2, 3] }]])
  assert.deepEqual([...m], [[1, { unread: 2, firstUnread: 41 }], [3, { unread: 0, firstUnread: null }]])
})

test('unreadCounts: nobody logged in or no threads -> no call, empty', async () => {
  const db = fakeDb({ data: [], error: null })
  assert.equal((await unreadCounts(db, null, [1])).size, 0)
  assert.equal((await unreadCounts(db, 'u1', [])).size, 0)
  assert.equal(db.calls.length, 0)
})

test('unreadCounts: an error or a throw -> empty (the list still shows, just without counts)', async () => {
  assert.equal((await unreadCounts(fakeDb({ data: null, error: { message: 'boom' } }), 'u1', [1])).size, 0)
  assert.equal((await unreadCounts(fakeDb(() => { throw new Error('down') }), 'u1', [1])).size, 0)
})
