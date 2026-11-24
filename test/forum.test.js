// node --test: reading threads from Supabase (lib/forum.js) with a fake client that records
// the query it was given and answers with canned rows
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { listThreads, getThread, parseId, PAGE_SIZE } from '../lib/forum.js'

function fakeDb(answers) {
  const queries = []
  const events = []   // "ask <table>" when a query is built, "wait <table>" when it is awaited
  return {
    queries,
    events,
    from(table) {
      const q = { table, calls: [] }
      queries.push(q)
      events.push(`ask ${table}`)
      const builder = new Proxy({}, {
        get(_, name) {
          if (name === 'then') {
            events.push(`wait ${table}`)
            const a = answers[table]
            const out = typeof a === 'function' ? a(q) : a
            return (resolve) => resolve(out || { data: [], error: null })
          }
          return (...args) => { q.calls.push([name, ...args]); return builder }
        },
      })
      return builder
    },
  }
}
const call = (q, name) => q.calls.filter((c) => c[0] === name)

const T = (id, extra = {}) => ({ id, title: `చర్చ ${id}`, word: null, region: null, reply_count: 0,
  last_activity_at: '2026-11-21T10:00:00Z', author_name: 'సీత', author_pic: '', last_author_name: '', last_author_pic: '', pinned: false, ...extra })

test('parseId: positive whole numbers only', () => {
  assert.equal(parseId('12'), 12)
  assert.equal(parseId('0'), null)
  assert.equal(parseId('-3'), null)
  assert.equal(parseId('12abc'), null)
  assert.equal(parseId('1e3'), null)
  assert.equal(parseId(undefined), null)
  assert.equal(parseId('99999999999999999999'), null)
})

test('listThreads: pinned first, then latest activity; one page plus one to know if there is more', async () => {
  const db = fakeDb({ threads: { data: [T(1), T(2)], error: null }, reactions: { data: [], error: null } })
  const out = await listThreads(db, {})
  const q = db.queries[0]
  assert.equal(q.table, 'threads')
  assert.deepEqual(call(q, 'order').map((c) => [c[1], c[2]]), [
    ['pinned', { ascending: false }], ['last_activity_at', { ascending: false }], ['id', { ascending: false }]])
  assert.deepEqual(call(q, 'range')[0].slice(1), [0, PAGE_SIZE])
  assert.equal(out.more, false)
  assert.deepEqual(out.threads.map((t) => t.id), [1, 2])
})

test('listThreads: filters by word, by region, or "has a word"; page 2 starts after page 1', async () => {
  const db = fakeDb({ threads: { data: [], error: null } })
  await listThreads(db, { word: 'బొక్క' })
  await listThreads(db, { region: 'రాయలసీమ' })
  await listThreads(db, { words: true, page: 2 })
  const [w, r, any] = db.queries
  assert.deepEqual(call(w, 'eq')[0].slice(1), ['word', 'బొక్క'])
  assert.deepEqual(call(r, 'eq')[0].slice(1), ['region', 'రాయలసీమ'])
  assert.deepEqual(call(any, 'not')[0].slice(1), ['word', 'is', null])
  assert.deepEqual(call(any, 'range')[0].slice(1), [PAGE_SIZE, 2 * PAGE_SIZE])
})

test('listThreads: more=true when an extra row came back, which is not shown', async () => {
  const rows = Array.from({ length: PAGE_SIZE + 1 }, (_, i) => T(i + 1))
  const db = fakeDb({ threads: { data: rows, error: null }, reactions: { data: [], error: null } })
  const out = await listThreads(db, {})
  assert.equal(out.more, true)
  assert.equal(out.threads.length, PAGE_SIZE)
})

test('listThreads: each thread carries its first post\'s sticker counts', async () => {
  const db = fakeDb({
    threads: { data: [T(1), T(2)], error: null },
    reactions: { data: [{ thread_id: 1, post_id: null, sticker: 'keka', user_id: 'a' }, { thread_id: 1, post_id: null, sticker: 'keka', user_id: 'b' },
                        { thread_id: 2, post_id: null, sticker: 'dandam', user_id: 'a' }], error: null },
  })
  const out = await listThreads(db, {}, 'a')
  const rq = db.queries[1]
  assert.equal(rq.table, 'reactions')
  assert.deepEqual(call(rq, 'in')[0].slice(1), ['thread_id', [1, 2]])
  assert.deepEqual(call(rq, 'is')[0].slice(1), ['post_id', null])
  assert.deepEqual(out.threads[0].stickers.map((s) => [s.code, s.n, s.mine]), [['keka', 2, true]])
  assert.deepEqual(out.threads[1].stickers.map((s) => [s.code, s.n]), [['dandam', 1]])
})

test('listThreads: a Supabase error is thrown (the page shows its error screen)', async () => {
  const db = fakeDb({ threads: { data: null, error: { message: 'boom' } } })
  await assert.rejects(listThreads(db, {}), /boom/)
})

test('getThread: the thread, its replies in order, stickers per post and on the first post', async () => {
  const db = fakeDb({
    threads: { data: T(12, { body: 'మొదటి మాట' }), error: null },
    posts: { data: [{ id: 100, body: 'a' }, { id: 101, body: 'b' }], error: null },
    reactions: { data: [{ post_id: null, sticker: 'keka', user_id: 'u1' }, { post_id: 101, sticker: 'hahha', user_id: 'u2' },
                        { post_id: 101, sticker: 'hahha', user_id: 'u1' }], error: null },
  })
  const out = await getThread(db, 12, 'u1')
  const [tq, pq, rq] = db.queries
  assert.deepEqual(call(tq, 'eq')[0].slice(1), ['id', 12])
  assert.deepEqual(call(pq, 'eq')[0].slice(1), ['thread_id', 12])
  assert.deepEqual(call(pq, 'order').map((c) => c[1]), ['created_at', 'id'])
  assert.deepEqual(call(rq, 'eq')[0].slice(1), ['thread_id', 12])
  assert.equal(out.thread.id, 12)
  assert.deepEqual(out.stickers.map((s) => [s.code, s.n, s.mine]), [['keka', 1, true]])
  assert.deepEqual(out.posts.map((p) => p.stickers.map((s) => [s.code, s.n, s.mine])), [[], [['hahha', 2, true]]])
})

test('getThread: the thread, its replies and its stickers are asked for together', async () => {
  const db = fakeDb({ threads: { data: T(12), error: null } })
  await getThread(db, 12)
  const firstWait = db.events.findIndex((e) => e.startsWith('wait'))
  assert.deepEqual(db.events.slice(0, firstWait).sort(), ['ask posts', 'ask reactions', 'ask threads'], db.events.join(', '))
})

test('getThread: a missing thread -> null (the replies asked for alongside are ignored)', async () => {
  const db = fakeDb({ threads: { data: null, error: null } })
  assert.equal(await getThread(db, 5), null)
})
