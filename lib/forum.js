// Reading threads from Supabase (tables in supabase/migrations/001_forum_v2.sql). Pages pass
// the client (lib/db.js), so tests can pass a fake one.

import { countStickers } from './stickers.js'

export const PAGE_SIZE = 20

const LIST_COLUMNS = 'id,title,word,region,reply_count,last_activity_at,author_name,author_pic,' +
  'last_author_name,last_author_pic,pinned,source,created_at,photos'

// "12" -> 12; anything else (0, -3, 12abc, 1e3, too big) -> null
export function parseId(value) {
  const s = String(value ?? '')
  if (!/^[1-9][0-9]{0,15}$/.test(s)) return null
  const n = Number(s)
  return Number.isSafeInteger(n) ? n : null
}

function must({ data, error }) {
  if (error) throw new Error(`supabase: ${error.message}`)
  return data
}

// The front page: pinned first, then latest activity. word / region filter; words: only threads
// about a word (the పదాలు chip). One extra row says whether there is a next page.
export async function listThreads(db, { word, region, words = false, page = 1 } = {}, meId = null) {
  const from = (Math.max(1, page) - 1) * PAGE_SIZE
  let q = db.from('threads').select(LIST_COLUMNS)
  if (word) q = q.eq('word', word)
  else if (words) q = q.not('word', 'is', null)
  if (region) q = q.eq('region', region)
  q = q.order('pinned', { ascending: false }).order('last_activity_at', { ascending: false })
       .order('id', { ascending: false }).range(from, from + PAGE_SIZE)
  const rows = must(await q) || []
  const more = rows.length > PAGE_SIZE
  const threads = rows.slice(0, PAGE_SIZE)
  if (!threads.length) return { threads, more }

  // Stickers on each thread's first post, for the row's chips
  const reactions = must(await db.from('reactions').select('thread_id,sticker,user_id')
    .in('thread_id', threads.map((t) => t.id)).is('post_id', null)) || []
  const byThread = new Map()
  for (const r of reactions) {
    if (!byThread.has(r.thread_id)) byThread.set(r.thread_id, [])
    byThread.get(r.thread_id).push(r)
  }
  return { threads: threads.map((t) => ({ ...t, stickers: countStickers(byThread.get(t.id) || [], meId) })), more }
}

// A thread with its replies in order; stickers counted for the first post (thread.stickers) and
// each reply (post.stickers). null when there is no such thread.
export async function getThread(db, id, meId = null) {
  const thread = must(await db.from('threads').select('*').eq('id', id).maybeSingle())
  if (!thread) return null
  const posts = must(await db.from('posts').select('id,author_id,author_name,author_pic,body,photos,source,created_at,edited_at')
    .eq('thread_id', id).order('created_at', { ascending: true }).order('id', { ascending: true })) || []
  const reactions = must(await db.from('reactions').select('post_id,sticker,user_id').eq('thread_id', id)) || []
  const first = reactions.filter((r) => r.post_id === null)
  const byPost = new Map()
  for (const r of reactions) {
    if (r.post_id === null) continue
    if (!byPost.has(r.post_id)) byPost.set(r.post_id, [])
    byPost.get(r.post_id).push(r)
  }
  return {
    thread,
    stickers: countStickers(first, meId),
    posts: posts.map((p) => ({ ...p, stickers: countStickers(byPost.get(p.id) || [], meId) })),
  }
}
