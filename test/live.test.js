// node --test: live updates (lib/live.js): which database changes a page cares about, batching a
// burst of them into one refresh, and catching up when a phone comes back to the page.
// A change looks like Supabase Realtime's: {table, eventType, new, old}.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { threadEventMatters, listEventMatters, makeBatcher, needsCatchUp, CATCH_UP_AFTER_MS } from '../lib/live.js'

const ev = (table, eventType, row = {}, old = {}) => ({ table, eventType, new: row, old })
const CTX = { threadId: 12, meId: 'u1', postIds: [100, 101], wantList: false }

// ---------- the thread page ----------
test('thread: someone else\'s new or edited reply in this thread matters; in another thread it does not', () => {
  assert.equal(threadEventMatters(ev('posts', 'INSERT', { id: 102, thread_id: 12, author_id: 'u2' }), CTX), true)
  assert.equal(threadEventMatters(ev('posts', 'UPDATE', { id: 100, thread_id: 12, author_id: 'u2' }), CTX), true)
  assert.equal(threadEventMatters(ev('posts', 'INSERT', { id: 300, thread_id: 13, author_id: 'u2' }), CTX), false)
})

test('thread: my own reply or edit does not (the message bar already refreshes for it)', () => {
  assert.equal(threadEventMatters(ev('posts', 'INSERT', { id: 102, thread_id: 12, author_id: 'u1' }), CTX), false)
  assert.equal(threadEventMatters(ev('posts', 'UPDATE', { id: 100, thread_id: 12, author_id: 'u1' }), CTX), false)
  assert.equal(threadEventMatters(ev('posts', 'INSERT', { id: 102, thread_id: 12, author_id: 'u1' }), { ...CTX, meId: null }), true,
    'logged out: every reply is someone else\'s')
})

test('thread: a deleted reply matters only if it is on this page (deletes carry just the id)', () => {
  assert.equal(threadEventMatters(ev('posts', 'DELETE', {}, { id: 101 }), CTX), true)
  assert.equal(threadEventMatters(ev('posts', 'DELETE', {}, { id: 999 }), CTX), false)
})

test('thread: someone else\'s sticker here matters; mine, another thread\'s, or a removed one does not', () => {
  assert.equal(threadEventMatters(ev('reactions', 'INSERT', { thread_id: 12, user_id: 'u2' }), CTX), true)
  assert.equal(threadEventMatters(ev('reactions', 'INSERT', { thread_id: 12, user_id: 'u1' }), CTX), false)
  assert.equal(threadEventMatters(ev('reactions', 'INSERT', { thread_id: 13, user_id: 'u2' }), CTX), false)
  assert.equal(threadEventMatters(ev('reactions', 'DELETE', {}, { id: 5 }), CTX), false, 'no thread to match: shown on the next refresh')
})

test('thread: this thread\'s own row (an edited title) matters; other threads only when the side list is showing', () => {
  assert.equal(threadEventMatters(ev('threads', 'UPDATE', { id: 12 }), CTX), true)
  assert.equal(threadEventMatters(ev('threads', 'UPDATE', { id: 13 }), CTX), false, 'phone: the list is hidden')
  assert.equal(threadEventMatters(ev('threads', 'UPDATE', { id: 13 }), { ...CTX, wantList: true }), true, 'desktop: the list is beside it')
  assert.equal(threadEventMatters(ev('threads', 'INSERT', { id: 14 }), { ...CTX, wantList: true }), true)
  assert.equal(threadEventMatters(ev('threads', 'DELETE', {}, { id: 12 }), CTX), true, 'this thread was deleted')
})

test('thread: anything malformed or from another table is ignored', () => {
  assert.equal(threadEventMatters(null, CTX), false)
  assert.equal(threadEventMatters(ev('thread_reads', 'INSERT', { thread_id: 12 }), CTX), false)
  assert.equal(threadEventMatters(ev('posts', 'INSERT', null), CTX), false)
})

// ---------- the chat list (front page) ----------
test('list: any thread added, changed or removed matters', () => {
  assert.equal(listEventMatters(ev('threads', 'UPDATE', { id: 3 })), true)
  assert.equal(listEventMatters(ev('threads', 'INSERT', { id: 4 })), true)
  assert.equal(listEventMatters(ev('threads', 'DELETE', {}, { id: 4 })), true)
  assert.equal(listEventMatters(ev('posts', 'INSERT', { id: 1 })), false, 'a reply also updates its thread row; that is the one we use')
})

// ---------- batching ----------
function fakeClock() {
  let now = 0, next = 1
  const timers = new Map()
  return {
    now: () => now,
    setTimeout: (fn, ms) => { const id = next++; timers.set(id, { fn, at: now + ms }); return id },
    clearTimeout: (id) => timers.delete(id),
    advance(ms) {
      const end = now + ms
      for (;;) {
        const due = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0]
        if (!due) break
        now = due[1].at; timers.delete(due[0]); due[1].fn()
      }
      now = end
    },
  }
}

test('batcher: a burst of changes makes one refresh, a moment after the last one', () => {
  const c = fakeClock(); let runs = 0
  const b = makeBatcher(() => runs++, { wait: 500, maxWait: 3000, ...c })
  b.push(); c.advance(200); b.push(); c.advance(200); b.push()
  c.advance(499); assert.equal(runs, 0)
  c.advance(1); assert.equal(runs, 1)
  c.advance(5000); assert.equal(runs, 1, 'nothing more without new changes')
})

test('batcher: a steady stream still refreshes at least every maxWait', () => {
  const c = fakeClock(); let runs = 0
  const b = makeBatcher(() => runs++, { wait: 500, maxWait: 2000, ...c })
  for (let t = 0; t < 2600; t += 300) { b.push(); c.advance(300) }
  assert.ok(runs >= 1, `ran ${runs} times`)
})

test('batcher: cancel drops what was waiting (the page is closing)', () => {
  const c = fakeClock(); let runs = 0
  const b = makeBatcher(() => runs++, { wait: 500, maxWait: 3000, ...c })
  b.push(); b.cancel(); c.advance(5000)
  assert.equal(runs, 0)
})

// ---------- coming back to the page ----------
test('catch up: after a while away, or when the live connection dropped; not after a quick glance away', () => {
  assert.equal(needsCatchUp({ hiddenAt: 0, now: CATCH_UP_AFTER_MS + 1, connected: true }), true)
  assert.equal(needsCatchUp({ hiddenAt: 0, now: 5000, connected: true }), false)
  assert.equal(needsCatchUp({ hiddenAt: 0, now: 5000, connected: false }), true)
  assert.equal(needsCatchUp({ hiddenAt: null, now: 5000, connected: true }), false, 'never hidden')
})
