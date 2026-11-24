// The rules for writing: who may start a thread, reply, give a sticker or delete, the limits,
// and who hears about a reply. Each function takes a store (lib/store.js on Supabase; an
// in-memory one in the tests) and the logged-in person from the site (lib/site.js getMe), and
// returns {status, body} for the route handler to send. Messages are Telugu, for the page.

import { cleanTitle, cleanBody, threadPath } from './text.js'
import { isSticker, countStickers } from './stickers.js'
import { parseId } from './forum.js'
import { ALL_REGION_IDS } from './regions.js'
import { siteUrl } from './site.js'
import { cleanPhotos, photoBase as envPhotoBase, photoUrls } from './photos.js'

// Per person: [window in seconds, most in that window]. Far above what a person does by hand,
// low enough that a script can't fill the forum (like the site's comment limits).
export const LIMITS = {
  thread: [[3600, 5], [86400, 20]],
  post: [[60, 10], [86400, 200]],
  reaction: [[60, 60]],
}
export const DELETE_WINDOW_MS = 5 * 60 * 1000
// Your own posts can be edited for 2 days: long enough to fix a mistake noticed later, short
// enough that an old discussion can't be rewritten under the replies to it
export const EDIT_WINDOW_MS = 48 * 3600 * 1000
const WORD_MAX = 100

const TOO_FAST = 'కొంచెం ఆగి మళ్ళీ ప్రయత్నించండి. చాలా త్వరగా రాస్తున్నారు.'
const reply = (status, body) => ({ status, body })
const bad = (message) => reply(400, { error: 'bad request', message })
const LOGIN = reply(401, { error: 'login', message: 'లాగిన్ అవ్వండి' })
const NOT_FOUND = reply(404, { error: 'not found', message: 'ఈ చర్చ దొరకలేదు' })
const NOT_YOURS = reply(403, { error: 'not allowed', message: 'ఇది ఇప్పుడు తీసేయలేరు' })
const NOT_EDITABLE = reply(403, { error: 'not allowed', message: 'ఇది ఇప్పుడు సవరించలేరు' })

// ---------- where a write may come from ----------
// The site's own address (SITE_API_URL's origin) plus FORUM_ORIGINS (comma separated), e.g.
// staging's or a local test's. A write from any other page (a forged form) is refused.
export function allowedOrigins(env = process.env) {
  const extra = String(env.FORUM_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
  return [new URL(siteUrl(env)).origin, ...extra.map((o) => o.replace(/\/+$/, ''))]
}

export function originAllowed(origin, allowed) {
  return !!origin && allowed.includes(origin)
}

// ---------- limits ----------
async function tooFast(store, kind, userId, now) {
  const [table, column] = { thread: ['threads', 'author_id'], post: ['posts', 'author_id'], reaction: ['reactions', 'user_id'] }[kind]
  for (const [secs, most] of LIMITS[kind]) {
    const since = new Date(now - secs * 1000).toISOString()
    if (await store.countSince(table, column, userId, since) >= most) return true
  }
  return false
}

function cleanWord(value) {
  const word = String(value ?? '').trim()
  if (!word) return { ok: true, value: null }
  if (word.length > WORD_MAX || /[\r\n]/.test(word)) return { ok: false, error: 'పదం సరిగ్గా లేదు' }
  return { ok: true, value: word }
}

function cleanRegion(value) {
  const region = String(value ?? '').trim()
  if (!region) return { ok: true, value: null }
  return ALL_REGION_IDS.includes(region) ? { ok: true, value: region } : { ok: false, error: 'ప్రాంతం సరిగ్గా లేదు' }
}

const author = (me) => ({ author_id: me.id, author_name: me.name || '', author_pic: me.pic || '' })
const age = (row, now) => now - new Date(row.created_at)

// ---------- starting a thread ----------
export async function createThread(store, me, input, now = new Date(), { photoBase = envPhotoBase() } = {}) {
  if (!me) return LOGIN
  const title = cleanTitle(input?.title)
  if (!title.ok) return bad(title.error)
  const body = cleanBody(input?.body, { allowEmpty: true })
  if (!body.ok) return bad(body.error)
  const word = cleanWord(input?.word)
  if (!word.ok) return bad(word.error)
  const region = cleanRegion(input?.region)
  if (!region.ok) return bad(region.error)
  const photos = cleanPhotos(input?.photos, photoBase)
  if (!photos.ok) return bad(photos.error)
  if (await tooFast(store, 'thread', me.id, now)) return reply(429, { error: 'too many', message: TOO_FAST })
  const thread = await store.insertThread({
    title: title.value, body: body.value, word: word.value, region: region.value, photos: photos.value, ...author(me),
    source: 'site', last_activity_at: now.toISOString(),
  })
  return reply(201, { id: thread.id, path: threadPath(thread) })
}

// ---------- replying ----------
// notify({to, actor, thread: {id, title}, body}) tells the site (lib/site.js notifyReply); a
// failure there never loses the reply.
export async function createReply(store, me, input, { now = new Date(), notify = null, photoBase = envPhotoBase() } = {}) {
  if (!me) return LOGIN
  const threadId = parseId(input?.threadId)
  const thread = threadId && await store.getThread(threadId)
  if (!thread) return NOT_FOUND
  const photos = cleanPhotos(input?.photos, photoBase)
  if (!photos.ok) return bad(photos.error)
  // A reply may be only photos
  const body = cleanBody(input?.body, { allowEmpty: photos.value.length > 0 })
  if (!body.ok) return bad(body.error)
  if (await tooFast(store, 'post', me.id, now)) return reply(429, { error: 'too many', message: TOO_FAST })
  const earlier = await store.participants(thread.id)
  const post = await store.insertPost({ thread_id: thread.id, ...author(me), body: body.value, photos: photos.value, source: 'site' })
  const to = [...new Set([thread.author_id, ...earlier])].filter((id) => id && id !== me.id)
  if (notify && to.length) {
    try {
      await notify({ to, actor: me.id, thread: { id: thread.id, title: thread.title }, body: body.value })
    } catch (e) { /* the reply is saved; 🔔 and email are best effort */ }
  }
  return reply(201, { post: { id: post.id, created_at: post.created_at } })
}

// ---------- stickers ----------
// Tap: adds your sticker; tap again: takes it back. Answers with that post's sticker counts.
export async function toggleSticker(store, me, input, now = new Date()) {
  if (!me) return LOGIN
  if (!isSticker(input?.sticker)) return bad('ఈ స్టిక్కర్ లేదు')
  const threadId = parseId(input?.threadId)
  const thread = threadId && await store.getThread(threadId)
  if (!thread) return NOT_FOUND
  let postId = null
  if (input?.postId !== undefined && input?.postId !== null && input?.postId !== '') {
    postId = parseId(input.postId)
    const post = postId && await store.getPost(postId)
    if (!post || post.thread_id !== thread.id) return NOT_FOUND
  }
  const row = { thread_id: thread.id, post_id: postId, user_id: me.id, sticker: input.sticker }
  if (await tooFast(store, 'reaction', me.id, now)) return reply(429, { error: 'too many', message: TOO_FAST })
  if (await store.addReaction(row) === 'exists') await store.removeReaction(row)
  return reply(200, { stickers: countStickers(await store.reactionsOf(thread.id, postId), me.id) })
}

// ---------- deleting ----------
// Photos of deleted posts: deletePhotos(urls) asks the site to remove them from S3 (lib/site.js);
// best effort, the post is gone either way.
async function forgetPhotos(deletePhotos, urls) {
  if (!deletePhotos || !urls.length) return
  try { await deletePhotos(urls) } catch (e) { /* leftover files are harmless */ }
}

// Your own reply within 5 minutes; an admin any reply.
export async function deleteReply(store, me, input, now = new Date(), { deletePhotos = null } = {}) {
  if (!me) return LOGIN
  const postId = parseId(input?.postId)
  const post = postId && await store.getPost(postId)
  if (!post) return NOT_FOUND
  if (!me.admin && (post.author_id !== me.id || age(post, now) > DELETE_WINDOW_MS)) return NOT_YOURS
  await store.deletePost(post.id)
  await forgetPhotos(deletePhotos, photoUrls(post.photos))
  return reply(200, { deleted: post.id })
}

// Your own thread within 5 minutes and before anyone replied; an admin any thread (its replies
// and stickers go with it).
export async function deleteThread(store, me, input, now = new Date(), { deletePhotos = null } = {}) {
  if (!me) return LOGIN
  const threadId = parseId(input?.threadId)
  const thread = threadId && await store.getThread(threadId)
  if (!thread) return NOT_FOUND
  if (!me.admin && (thread.author_id !== me.id || age(thread, now) > DELETE_WINDOW_MS || thread.reply_count > 0)) return NOT_YOURS
  const photos = await store.threadPhotos(thread.id)
  await store.deleteThread(thread.id)
  await forgetPhotos(deletePhotos, photoUrls(photos))
  return reply(200, { deleted: thread.id })
}

// ---------- reading ----------
// The browser says "I opened this thread" (components/chat/MarkRead.js): unread counts restart from
// now for this person. Done from the browser, not while the page renders, because Next.js may
// fetch thread pages ahead of time from the list's links.
export async function markRead(store, me, input) {
  if (!me) return LOGIN
  const threadId = parseId(input?.threadId)
  const thread = threadId && await store.getThread(threadId)
  if (!thread) return NOT_FOUND
  await store.markRead(me.id, thread.id)
  return reply(200, { read: thread.id })
}

// ---------- editing ----------
// Your own reply, or your own thread's title and text, within EDIT_WINDOW_MS of posting. Not
// admins on others' posts (they can delete, never change someone's words). An edit marks
// edited_at and changes nothing else: stickers stay, nobody is notified, and the thread's last
// activity doesn't move (the database's counters trigger runs on new and deleted replies only).
const mayEdit = (me, row, now) => row.author_id === me.id && age(row, now) <= EDIT_WINDOW_MS

export async function editReply(store, me, input, now = new Date()) {
  if (!me) return LOGIN
  const postId = parseId(input?.postId)
  const post = postId && await store.getPost(postId)
  if (!post) return NOT_FOUND
  if (!mayEdit(me, post, now)) return NOT_EDITABLE
  const body = cleanBody(input?.body)
  if (!body.ok) return bad(body.error)
  const edited_at = now.toISOString()
  await store.updatePost(post.id, { body: body.value, edited_at })
  return reply(200, { post: { id: post.id, body: body.value, edited_at } })
}

export async function editThread(store, me, input, now = new Date()) {
  if (!me) return LOGIN
  const threadId = parseId(input?.threadId)
  const thread = threadId && await store.getThread(threadId)
  if (!thread) return NOT_FOUND
  if (!mayEdit(me, thread, now)) return NOT_EDITABLE
  const title = cleanTitle(input?.title)
  if (!title.ok) return bad(title.error)
  const body = cleanBody(input?.body, { allowEmpty: true })
  if (!body.ok) return bad(body.error)
  const updated = await store.updateThread(thread.id, { title: title.value, body: body.value, edited_at: now.toISOString() })
  return reply(200, { id: thread.id, path: threadPath({ id: thread.id, title: updated?.title ?? title.value }) })
}
