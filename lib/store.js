// lib/write.js's store on Supabase (the service-role client from lib/db.js writeDb). Each
// method is one query; errors are thrown (the route answers 500, nothing half-saved: the
// counters are kept by the database's trigger).

const UNIQUE_VIOLATION = '23505'

function must({ data, error }) {
  if (error) throw new Error(`supabase: ${error.message}`)
  return data
}

const onPost = (q, postId) => (postId === null ? q.is('post_id', null) : q.eq('post_id', postId))

export function supabaseStore(db) {
  return {
    async countSince(table, column, userId, sinceIso) {
      const { count, error } = await db.from(table).select('id', { count: 'exact', head: true })
        .eq(column, userId).gte('created_at', sinceIso)
      if (error) throw new Error(`supabase: ${error.message}`)
      return count || 0
    },
    async insertThread(row) {
      return must(await db.from('threads').insert(row).select('id,title,created_at').single())
    },
    async getThread(id) {
      return must(await db.from('threads').select('id,title,author_id,created_at,reply_count').eq('id', id).maybeSingle())
    },
    async insertPost(row) {
      return must(await db.from('posts').insert(row).select('id,created_at').single())
    },
    async getPost(id) {
      return must(await db.from('posts').select('id,thread_id,author_id,created_at,photos').eq('id', id).maybeSingle())
    },
    async participants(threadId) {
      const rows = must(await db.from('posts').select('author_id').eq('thread_id', threadId)) || []
      return [...new Set(rows.map((r) => r.author_id))]
    },
    async updateThread(id, fields) {
      return must(await db.from('threads').update(fields).eq('id', id).select('id,title').single())
    },
    async updatePost(id, fields) {
      return must(await db.from('posts').update(fields).eq('id', id).select('id').single())
    },
    // Every photo of a thread: its own and all its replies' (before deleting it)
    async threadPhotos(threadId) {
      const t = must(await db.from('threads').select('photos').eq('id', threadId).maybeSingle())
      const posts = must(await db.from('posts').select('photos').eq('thread_id', threadId)) || []
      return [...((t && t.photos) || []), ...posts.flatMap((p) => p.photos || [])]
    },
    async deletePost(id) {
      must(await db.from('posts').delete().eq('id', id))
    },
    async deleteThread(id) {
      must(await db.from('threads').delete().eq('id', id))
    },
    // 'added', or 'exists' when this person already gave this sticker here (reactions_once)
    async addReaction(row) {
      const { error } = await db.from('reactions').insert(row)
      if (!error) return 'added'
      if (error.code === UNIQUE_VIOLATION) return 'exists'
      throw new Error(`supabase: ${error.message}`)
    },
    async removeReaction({ thread_id, post_id, user_id, sticker }) {
      must(await onPost(db.from('reactions').delete().eq('thread_id', thread_id).eq('user_id', user_id).eq('sticker', sticker), post_id))
    },
    async reactionsOf(threadId, postId) {
      return must(await onPost(db.from('reactions').select('sticker,user_id').eq('thread_id', threadId), postId)) || []
    },
  }
}
