// node --test: the rules for writing (lib/write.js) against an in-memory store
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { markRead, createThread, createReply, toggleSticker, deleteReply, deleteThread, editReply, editThread, originAllowed, allowedOrigins, LIMITS, EDIT_WINDOW_MS } from '../lib/write.js'

const ME = { id: 'u1', name: 'సీత', pic: 'https://x/s.jpg', admin: false }
const OTHER = { id: 'u2', name: 'రఘు', pic: '', admin: false }
const ADMIN = { id: 'a1', name: 'అడ్మిన్', pic: '', admin: true }
const NOW = new Date('2026-11-21T12:00:00Z')
const ago = (secs) => new Date(NOW - secs * 1000).toISOString()

function memStore() {
  let next = 1
  const s = {
    threads: [], posts: [], reactions: [],
    async countSince(table, column, userId, sinceIso) {
      return s[table].filter((r) => r[column] === userId && r.created_at >= sinceIso).length
    },
    async insertThread(row) { const t = { id: next++, reply_count: 0, created_at: NOW.toISOString(), ...row }; s.threads.push(t); return t },
    async getThread(id) { return s.threads.find((t) => t.id === id) || null },
    async insertPost(row) { const p = { id: next++, created_at: NOW.toISOString(), ...row }; s.posts.push(p); return p },
    async getPost(id) { return s.posts.find((p) => p.id === id) || null },
    async participants(threadId) { return [...new Set(s.posts.filter((p) => p.thread_id === threadId).map((p) => p.author_id))] },
    async threadPhotos(threadId) { return [...(s.threads.find((t) => t.id === threadId)?.photos || []), ...s.posts.filter((p) => p.thread_id === threadId).flatMap((p) => p.photos || [])] },
    async deletePost(id) { s.posts = s.posts.filter((p) => p.id !== id); s.reactions = s.reactions.filter((r) => r.post_id !== id) },
    async deleteThread(id) { s.threads = s.threads.filter((t) => t.id !== id); s.posts = s.posts.filter((p) => p.thread_id !== id); s.reactions = s.reactions.filter((r) => r.thread_id !== id) },
    async addReaction(row) {
      if (s.reactions.some((r) => r.thread_id === row.thread_id && r.post_id === row.post_id && r.user_id === row.user_id && r.sticker === row.sticker)) return 'exists'
      s.reactions.push({ ...row, created_at: NOW.toISOString() }); return 'added'
    },
    async removeReaction(m) { s.reactions = s.reactions.filter((r) => !(r.thread_id === m.thread_id && r.post_id === m.post_id && r.user_id === m.user_id && r.sticker === m.sticker)) },
    async reactionsOf(threadId, postId) { return s.reactions.filter((r) => r.thread_id === threadId && r.post_id === postId) },
    reads: [],
    async markRead(userId, threadId) { s.reads.push([userId, threadId]) },
    async updateThread(id, fields) { const t = s.threads.find((x) => x.id === id); Object.assign(t, fields); return t },
    async updatePost(id, fields) { const p = s.posts.find((x) => x.id === id); Object.assign(p, fields); return p },
  }
  return s
}

// ---------- where requests may come from ----------
test('originAllowed: only the forum\'s own site pages may write', () => {
  const allowed = allowedOrigins({ SITE_API_URL: 'https://www.yaasalu.com' })
  assert.deepEqual(allowed, ['https://www.yaasalu.com'])
  assert.equal(originAllowed('https://www.yaasalu.com', allowed), true)
  assert.equal(originAllowed('https://evil.example', allowed), false)
  assert.equal(originAllowed('https://www.yaasalu.com.evil.example', allowed), false)
  assert.equal(originAllowed(null, allowed), false)
  assert.equal(originAllowed('', allowed), false)
})

test('allowedOrigins: FORUM_ORIGINS adds more (staging, local)', () => {
  assert.deepEqual(allowedOrigins({ SITE_API_URL: 'https://yaasa.herokuapp.com/', FORUM_ORIGINS: 'http://localhost:3055, https://x.test' }),
                   ['https://yaasa.herokuapp.com', 'http://localhost:3055', 'https://x.test'])
})

// ---------- starting a thread ----------
test('createThread: logged out -> 401, nothing saved', async () => {
  const s = memStore()
  assert.equal((await createThread(s, null, { title: 'x' }, NOW)).status, 401)
  assert.equal(s.threads.length, 0)
})

test('createThread: saves a cleaned thread with the author\'s name and photo, returns its path', async () => {
  const s = memStore()
  const r = await createThread(s, ME, { title: '  బొక్క   అంటే? ', body: ' మా ఊర్లో\nతిట్టు ', word: ' బొక్క ', region: 'రాయలసీమ' }, NOW)
  assert.equal(r.status, 201)
  const t = s.threads[0]
  assert.deepEqual({ title: t.title, body: t.body, word: t.word, region: t.region, author_id: t.author_id, author_name: t.author_name, author_pic: t.author_pic, source: t.source },
                   { title: 'బొక్క అంటే?', body: 'మా ఊర్లో\nతిట్టు', word: 'బొక్క', region: 'రాయలసీమ', author_id: 'u1', author_name: 'సీత', author_pic: 'https://x/s.jpg', source: 'site' })
  assert.equal(t.last_activity_at, NOW.toISOString())
  assert.equal(r.body.path, `/t/${t.id}/bokka-ante`)
})

test('createThread: no word or region is fine; a body may be empty', async () => {
  const s = memStore()
  const r = await createThread(s, ME, { title: 'ఒక ప్రశ్న', word: '', region: '' }, NOW)
  assert.equal(r.status, 201)
  assert.deepEqual([s.threads[0].word, s.threads[0].region, s.threads[0].body], [null, null, ''])
})

test('createThread: bad input -> 400 with a Telugu message, nothing saved', async () => {
  const s = memStore()
  for (const input of [{ title: '   ' }, { title: 'అ'.repeat(201) }, { title: 'x', body: 'a'.repeat(5001) },
                       { title: 'x', region: 'మార్స్' }, { title: 'x', word: 'అ'.repeat(101) }, { title: 'x', word: 'two\nlines' }]) {
    const r = await createThread(s, ME, input, NOW)
    assert.equal(r.status, 400, JSON.stringify(input))
    assert.ok(r.body.message, 'has a message')
  }
  assert.equal(s.threads.length, 0)
})

test('createThread: more than the hourly limit -> 429', async () => {
  const s = memStore()
  const [[secs, most]] = LIMITS.thread
  for (let i = 0; i < most; i++) s.threads.push({ id: 100 + i, author_id: 'u1', created_at: ago(secs - 60) })
  s.threads.push({ id: 200, author_id: 'u1', created_at: ago(secs + 60) })   // older than the window: doesn't count
  const r = await createThread(s, ME, { title: 'one more' }, NOW)
  assert.equal(r.status, 429)
  assert.ok(r.body.message.includes('ఆగి'))
})

// ---------- replying ----------
test('createReply: logged out 401; a missing thread 404; empty or too long 400', async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 't', author_id: 'u2' })
  assert.equal((await createReply(s, null, { threadId: t.id, body: 'x' }, { now: NOW })).status, 401)
  assert.equal((await createReply(s, ME, { threadId: 999, body: 'x' }, { now: NOW })).status, 404)
  assert.equal((await createReply(s, ME, { threadId: 'abc', body: 'x' }, { now: NOW })).status, 404)
  assert.equal((await createReply(s, ME, { threadId: t.id, body: '  ' }, { now: NOW })).status, 400)
  assert.equal((await createReply(s, ME, { threadId: t.id, body: 'a'.repeat(5001) }, { now: NOW })).status, 400)
  assert.equal(s.posts.length, 0)
})

test('createReply: saves it and tells the thread\'s author and earlier repliers, never the writer', async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 'బొక్క అంటే?', author_id: 'u2' })
  await s.insertPost({ thread_id: t.id, author_id: 'u3', body: 'earlier' })
  await s.insertPost({ thread_id: t.id, author_id: 'u1', body: 'mine earlier' })
  const told = []
  const r = await createReply(s, ME, { threadId: t.id, body: ' కడపలో కూడా అంతే. ' }, { now: NOW, notify: async (x) => { told.push(x); return true } })
  assert.equal(r.status, 201)
  const p = s.posts.at(-1)
  assert.deepEqual({ thread_id: p.thread_id, author_id: p.author_id, author_name: p.author_name, body: p.body },
                   { thread_id: t.id, author_id: 'u1', author_name: 'సీత', body: 'కడపలో కూడా అంతే.' })
  assert.equal(told.length, 1)
  assert.deepEqual(told[0].to.sort(), ['u2', 'u3'])
  assert.equal(told[0].actor, 'u1')
  assert.deepEqual(told[0].thread, { id: t.id, title: 'బొక్క అంటే?' })
  assert.equal(told[0].body, 'కడపలో కూడా అంతే.')
  assert.equal(r.body.post.id, p.id)
})

test('createReply: replying in your own thread with no one else there tells nobody', async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 't', author_id: 'u1' })
  const told = []
  await createReply(s, ME, { threadId: t.id, body: 'x' }, { now: NOW, notify: async (x) => { told.push(x) } })
  assert.equal(told.length, 0)
})

test('createReply: a failing notification still saves the reply', async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 't', author_id: 'u2' })
  const r = await createReply(s, ME, { threadId: t.id, body: 'x' }, { now: NOW, notify: async () => { throw new Error('site down') } })
  assert.equal(r.status, 201)
  assert.equal(s.posts.length, 1)
})

test('createReply: per-minute limit -> 429', async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 't', author_id: 'u2' })
  const [secs, most] = LIMITS.post[0]
  for (let i = 0; i < most; i++) s.posts.push({ id: 500 + i, thread_id: t.id, author_id: 'u1', created_at: ago(secs / 2) })
  assert.equal((await createReply(s, ME, { threadId: t.id, body: 'x' }, { now: NOW })).status, 429)
})

// The store's lookups take a tick to answer, and say when each starts and ends, so a test can
// see which of them were asked for together
function timedStore() {
  const s = memStore()
  const log = []
  for (const name of ['getThread', 'countSince', 'participants']) {
    const real = s[name]
    s[name] = async (...args) => {
      log.push(`start ${name}`)
      await new Promise((r) => setImmediate(r))
      log.push(`end ${name}`)
      return real(...args)
    }
  }
  return { s, log }
}
const startedTogether = (log) => log.slice(0, log.findIndex((e) => e.startsWith('end')))

test('createReply: asks for the thread, the limits and the earlier repliers together', async () => {
  const { s, log } = timedStore()
  const t = await s.insertThread({ title: 't', author_id: 'u2' })
  log.length = 0
  assert.equal((await createReply(s, ME, { threadId: t.id, body: 'x' }, { now: NOW })).status, 201)
  const before = startedTogether(log)
  assert.ok(before.includes('start getThread'), log.join(', '))
  assert.ok(before.includes('start participants'), log.join(', '))
  assert.equal(before.filter((e) => e === 'start countSince').length, LIMITS.post.length, 'every limit window at once')
})

test('createReply: the daily limit alone still refuses', async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 't', author_id: 'u2' })
  const [secs, most] = LIMITS.post[1]
  for (let i = 0; i < most; i++) s.posts.push({ id: 500 + i, thread_id: t.id, author_id: 'u1', created_at: ago(Math.max(secs / 2, LIMITS.post[0][0] * 2)) })
  assert.equal((await createReply(s, ME, { threadId: t.id, body: 'x' }, { now: NOW })).status, 429)
})

test('createReply: the same checks win as before: missing thread 404, empty 400, even when the limit is full', async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 't', author_id: 'u2' })
  const [secs, most] = LIMITS.post[0]
  for (let i = 0; i < most; i++) s.posts.push({ id: 500 + i, thread_id: t.id, author_id: 'u1', created_at: ago(secs / 2) })
  assert.equal((await createReply(s, ME, { threadId: 999, body: 'x' }, { now: NOW })).status, 404)
  assert.equal((await createReply(s, ME, { threadId: t.id, body: ' ' }, { now: NOW })).status, 400)
  assert.equal(s.posts.length, most, 'nothing saved')
})

test('createThread: every limit window is counted at once', async () => {
  const { s, log } = timedStore()
  assert.equal((await createThread(s, ME, { title: 'కొత్త' }, NOW)).status, 201)
  assert.equal(startedTogether(log).filter((e) => e === 'start countSince').length, LIMITS.thread.length)
})

// ---------- stickers ----------
test('toggleSticker: logged out 401; unknown sticker 400; missing thread 404; a reply from another thread 404', async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 't', author_id: 'u2' })
  const t2 = await s.insertThread({ title: 't2', author_id: 'u2' })
  const other = await s.insertPost({ thread_id: t2.id, author_id: 'u2', body: 'x' })
  assert.equal((await toggleSticker(s, null, { threadId: t.id, sticker: 'keka' }, NOW)).status, 401)
  assert.equal((await toggleSticker(s, ME, { threadId: t.id, sticker: 'nope' }, NOW)).status, 400)
  assert.equal((await toggleSticker(s, ME, { threadId: 999, sticker: 'keka' }, NOW)).status, 404)
  assert.equal((await toggleSticker(s, ME, { threadId: t.id, postId: other.id, sticker: 'keka' }, NOW)).status, 404)
  assert.equal(s.reactions.length, 0)
})

test('toggleSticker: tap adds yours, tap again takes it back; counts come back for that post', async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 't', author_id: 'u2' })
  await s.addReaction({ thread_id: t.id, post_id: null, user_id: 'u2', sticker: 'keka' })
  let r = await toggleSticker(s, ME, { threadId: t.id, sticker: 'keka' }, NOW)
  assert.equal(r.status, 200)
  assert.deepEqual(r.body.stickers.map((x) => [x.code, x.n, x.mine]), [['keka', 2, true]])
  r = await toggleSticker(s, ME, { threadId: t.id, sticker: 'keka' }, NOW)
  assert.deepEqual(r.body.stickers.map((x) => [x.code, x.n, x.mine]), [['keka', 1, false]])
})

test('toggleSticker: on a reply, separate from the first post', async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 't', author_id: 'u2' })
  const p = await s.insertPost({ thread_id: t.id, author_id: 'u2', body: 'x' })
  const r = await toggleSticker(s, ME, { threadId: t.id, postId: p.id, sticker: 'dandam' }, NOW)
  assert.deepEqual(r.body.stickers.map((x) => [x.code, x.n]), [['dandam', 1]])
  assert.deepEqual(s.reactions.map((x) => x.post_id), [p.id])
})

// ---------- deleting ----------
test('deleteReply: yours within 5 minutes; not after; not someone else\'s; admins any', async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 't', author_id: 'u2' })
  const fresh = await s.insertPost({ thread_id: t.id, author_id: 'u1', body: 'x', created_at: ago(60) })
  const old = await s.insertPost({ thread_id: t.id, author_id: 'u1', body: 'x', created_at: ago(10 * 60) })
  const theirs = await s.insertPost({ thread_id: t.id, author_id: 'u2', body: 'x', created_at: ago(60) })
  assert.equal((await deleteReply(s, null, { postId: fresh.id }, NOW)).status, 401)
  assert.equal((await deleteReply(s, ME, { postId: 999 }, NOW)).status, 404)
  assert.equal((await deleteReply(s, ME, { postId: old.id }, NOW)).status, 403)
  assert.equal((await deleteReply(s, ME, { postId: theirs.id }, NOW)).status, 403)
  assert.equal((await deleteReply(s, ME, { postId: fresh.id }, NOW)).status, 200)
  assert.equal((await deleteReply(s, ADMIN, { postId: old.id }, NOW)).status, 200)
  assert.deepEqual(s.posts.map((p) => p.id), [theirs.id])
})

test('deleteThread: yours within 5 minutes and before anyone replied; admins any', async () => {
  const s = memStore()
  const mine = await s.insertThread({ title: 'm', author_id: 'u1', created_at: ago(60) })
  const replied = await s.insertThread({ title: 'r', author_id: 'u1', created_at: ago(60), reply_count: 1 })
  const old = await s.insertThread({ title: 'o', author_id: 'u1', created_at: ago(3600) })
  const theirs = await s.insertThread({ title: 't', author_id: 'u2', created_at: ago(60) })
  assert.equal((await deleteThread(s, ME, { threadId: replied.id }, NOW)).status, 403)
  assert.equal((await deleteThread(s, ME, { threadId: old.id }, NOW)).status, 403)
  assert.equal((await deleteThread(s, ME, { threadId: theirs.id }, NOW)).status, 403)
  assert.equal((await deleteThread(s, ME, { threadId: mine.id }, NOW)).status, 200)
  assert.equal((await deleteThread(s, ADMIN, { threadId: theirs.id }, NOW)).status, 200)
  assert.deepEqual(s.threads.map((t) => t.id).sort(), [replied.id, old.id].sort())
})

// ---------- editing ----------
test('edit window is 2 days', () => {
  assert.equal(EDIT_WINDOW_MS, 48 * 3600 * 1000)
})

test('editReply: your own reply within 2 days; text cleaned; edited_at set; nothing else changes', async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 't', author_id: 'u2', last_activity_at: ago(3600) })
  const p = await s.insertPost({ thread_id: t.id, author_id: 'u1', body: 'old', created_at: ago(47 * 3600) })
  await s.addReaction({ thread_id: t.id, post_id: p.id, user_id: 'u2', sticker: 'keka' })
  const r = await editReply(s, ME, { postId: p.id, body: '  కొత్త మాట  ' }, NOW)
  assert.equal(r.status, 200)
  assert.equal(s.posts[0].body, 'కొత్త మాట')
  assert.equal(s.posts[0].edited_at, NOW.toISOString())
  assert.deepEqual(r.body.post, { id: p.id, body: 'కొత్త మాట', edited_at: NOW.toISOString() })
  assert.equal(s.reactions.length, 1, 'stickers stay')
  assert.equal(s.threads[0].last_activity_at, ago(3600), 'the thread does not move to the top')
})

test('editReply: logged out 401; missing 404; someone else\'s 403; after 2 days 403; admins cannot edit others 403', async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 't', author_id: 'u2' })
  const mine = await s.insertPost({ thread_id: t.id, author_id: 'u1', body: 'x', created_at: ago(60) })
  const old = await s.insertPost({ thread_id: t.id, author_id: 'u1', body: 'x', created_at: ago(49 * 3600) })
  const theirs = await s.insertPost({ thread_id: t.id, author_id: 'u2', body: 'x', created_at: ago(60) })
  assert.equal((await editReply(s, null, { postId: mine.id, body: 'y' }, NOW)).status, 401)
  assert.equal((await editReply(s, ME, { postId: 999, body: 'y' }, NOW)).status, 404)
  assert.equal((await editReply(s, ME, { postId: theirs.id, body: 'y' }, NOW)).status, 403)
  assert.equal((await editReply(s, ME, { postId: old.id, body: 'y' }, NOW)).status, 403)
  assert.equal((await editReply(s, ADMIN, { postId: theirs.id, body: 'y' }, NOW)).status, 403)
  assert.deepEqual(s.posts.map((p) => p.body), ['x', 'x', 'x'])
})

test('editReply: empty or too long -> 400', async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 't', author_id: 'u2' })
  const p = await s.insertPost({ thread_id: t.id, author_id: 'u1', body: 'x', created_at: ago(60) })
  assert.equal((await editReply(s, ME, { postId: p.id, body: '   ' }, NOW)).status, 400)
  assert.equal((await editReply(s, ME, { postId: p.id, body: 'a'.repeat(5001) }, NOW)).status, 400)
  assert.equal(s.posts[0].body, 'x')
})

test('editThread: your own thread\'s title and text within 2 days; returns the new address', async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 'పాత శీర్షిక', body: 'పాత', author_id: 'u1', created_at: ago(40 * 3600), last_activity_at: ago(60), word: 'బేగా', region: 'కోస్తా' })
  const r = await editThread(s, ME, { threadId: t.id, title: '  కొత్త   శీర్షిక ', body: ' కొత్త ' }, NOW)
  assert.equal(r.status, 200)
  const u = s.threads[0]
  assert.deepEqual([u.title, u.body, u.edited_at, u.last_activity_at, u.word, u.region],
                   ['కొత్త శీర్షిక', 'కొత్త', NOW.toISOString(), ago(60), 'బేగా', 'కోస్తా'])
  assert.equal(r.body.path, `/t/${t.id}/kotta-shirshika`)
})

test('editThread: even after replies (only the writer, within 2 days); not others, not after 2 days, not admins', async () => {
  const s = memStore()
  const replied = await s.insertThread({ title: 't', author_id: 'u1', created_at: ago(60), reply_count: 3 })
  const old = await s.insertThread({ title: 't', author_id: 'u1', created_at: ago(49 * 3600) })
  const theirs = await s.insertThread({ title: 't', author_id: 'u2', created_at: ago(60) })
  assert.equal((await editThread(s, ME, { threadId: replied.id, title: 'new' }, NOW)).status, 200)
  assert.equal((await editThread(s, ME, { threadId: old.id, title: 'new' }, NOW)).status, 403)
  assert.equal((await editThread(s, ME, { threadId: theirs.id, title: 'new' }, NOW)).status, 403)
  assert.equal((await editThread(s, ADMIN, { threadId: theirs.id, title: 'new' }, NOW)).status, 403)
  assert.equal((await editThread(s, null, { threadId: replied.id, title: 'new' }, NOW)).status, 401)
  assert.equal((await editThread(s, ME, { threadId: 999, title: 'new' }, NOW)).status, 404)
  assert.equal((await editThread(s, ME, { threadId: replied.id, title: '  ' }, NOW)).status, 400)
})

// ---------- photos ----------
const PB = 'https://yaasalu-staging.s3.amazonaws.com/forum/'
const PH = (n) => ({ full: `${PB}2026-11/${'b'.repeat(15)}${n}.jpg`, thumb: `${PB}2026-11/${'b'.repeat(15)}${n}-t.jpg`, w: 2048, h: 1536 })

test('createThread / createReply keep cleaned photos', async () => {
  const s = memStore()
  const r = await createThread(s, ME, { title: 'ఫోటో', photos: [PH(1)] }, NOW, { photoBase: PB })
  assert.equal(r.status, 201)
  assert.deepEqual(s.threads[0].photos, [PH(1)])
  const r2 = await createReply(s, ME, { threadId: s.threads[0].id, body: 'ఇదిగో', photos: [PH(2), PH(3)] }, { now: NOW, photoBase: PB })
  assert.equal(r2.status, 201)
  assert.deepEqual(s.posts[0].photos, [PH(2), PH(3)])
})

test('a reply may be only photos; with neither text nor photos -> 400', async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 't', author_id: 'u2' })
  assert.equal((await createReply(s, ME, { threadId: t.id, body: '  ', photos: [PH(1)] }, { now: NOW, photoBase: PB })).status, 201)
  assert.equal(s.posts[0].body, '')
  assert.equal((await createReply(s, ME, { threadId: t.id, body: '  ', photos: [] }, { now: NOW, photoBase: PB })).status, 400)
})

test('photos from elsewhere, or with photos switched off -> 400, nothing saved', async () => {
  const s = memStore()
  const evil = [{ ...PH(1), full: 'https://evil.example/forum/x.jpg' }]
  assert.equal((await createThread(s, ME, { title: 't', photos: evil }, NOW, { photoBase: PB })).status, 400)
  assert.equal((await createThread(s, ME, { title: 't', photos: [PH(1)] }, NOW, { photoBase: null })).status, 400)
  assert.equal(s.threads.length, 0)
})

test('deleting a reply asks the site to delete its photos; a failure there still deletes the reply', async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 't', author_id: 'u2' })
  const p = await s.insertPost({ thread_id: t.id, author_id: 'u1', body: '', photos: [PH(1)], created_at: ago(60) })
  const asked = []
  assert.equal((await deleteReply(s, ME, { postId: p.id }, NOW, { deletePhotos: async (urls) => { asked.push(urls); throw new Error('site down') } })).status, 200)
  assert.deepEqual(asked, [[PH(1).full, PH(1).thumb]])
  assert.equal(s.posts.length, 0)
})

test("deleting a thread asks to delete its own photos and all its replies' photos", async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 't', author_id: 'u1', created_at: ago(60), photos: [PH(1)] })
  await s.insertPost({ thread_id: t.id, author_id: 'u2', body: 'x', photos: [PH(2)] })
  const asked = []
  assert.equal((await deleteThread(s, ADMIN, { threadId: t.id }, NOW, { deletePhotos: async (urls) => asked.push(urls) })).status, 200)
  assert.deepEqual(asked[0].sort(), [PH(1).full, PH(1).thumb, PH(2).full, PH(2).thumb].sort())
})

test('deleting a post without photos asks nothing', async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 't', author_id: 'u2' })
  const p = await s.insertPost({ thread_id: t.id, author_id: 'u1', body: 'x', created_at: ago(60) })
  const asked = []
  await deleteReply(s, ME, { postId: p.id }, NOW, { deletePhotos: async (urls) => asked.push(urls) })
  assert.deepEqual(asked, [])
})

// ---------- reading ----------
test('markRead: logged out 401; a missing thread 404; otherwise records it for this person', async () => {
  const s = memStore()
  const t = await s.insertThread({ title: 't', author_id: 'u2' })
  assert.equal((await markRead(s, null, { threadId: t.id })).status, 401)
  assert.equal((await markRead(s, ME, { threadId: 999 })).status, 404)
  assert.equal((await markRead(s, ME, { threadId: 'x' })).status, 404)
  assert.equal((await markRead(s, ME, { threadId: t.id })).status, 200)
  assert.deepEqual(s.reads, [['u1', t.id]])
})
