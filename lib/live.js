// Live updates (Supabase Realtime): which database changes a page cares about, batching a burst
// of them into one refresh, and catching up when a phone comes back to the page. Pure functions;
// components/chat/Live.js does the subscribing. A change looks like Realtime's
// {table, eventType: 'INSERT' | 'UPDATE' | 'DELETE', new, old}; deletes carry only the row's id.

// Away from the page for this long (or the connection dropped): refresh once on return
export const CATCH_UP_AFTER_MS = 30 * 1000

const rowOf = (e) => (e.eventType === 'DELETE' ? e.old : e.new) || null

// The thread page: {threadId, meId, postIds (on the page now), wantList (the side list is showing)}
export function threadEventMatters(e, { threadId, meId = null, postIds = [], wantList = false }) {
  if (!e || !e.table) return false
  const row = rowOf(e)
  if (!row) return false
  if (e.table === 'posts') {
    if (e.eventType === 'DELETE') return postIds.includes(row.id)
    return row.thread_id === threadId && (!meId || row.author_id !== meId)
  }
  if (e.table === 'reactions') {
    // A removed sticker can't be placed (no thread in a delete): it shows on the next refresh
    if (e.eventType === 'DELETE') return false
    return row.thread_id === threadId && (!meId || row.user_id !== meId)
  }
  if (e.table === 'threads') return row.id === threadId || wantList
  return false
}

// The chat list: any thread added, changed (a reply updates its thread's row) or removed
export function listEventMatters(e) {
  return !!e && e.table === 'threads'
}

// One run a moment after the last push (wait), and at least every maxWait during a steady stream
export function makeBatcher(run, { wait = 500, maxWait = 2000, setTimeout = globalThis.setTimeout,
                                   clearTimeout = globalThis.clearTimeout, now = Date.now } = {}) {
  let timer = null
  let first = null
  const fire = () => { timer = null; first = null; run() }
  return {
    push() {
      const t = now()
      if (first === null) first = t
      if (timer !== null) clearTimeout(timer)
      timer = setTimeout(fire, Math.max(0, Math.min(wait, first + maxWait - t)))
    },
    cancel() {
      if (timer !== null) clearTimeout(timer)
      timer = null; first = null
    },
  }
}

export function needsCatchUp({ hiddenAt, now, connected }) {
  if (hiddenAt === null || hiddenAt === undefined) return false
  return !connected || now - hiddenAt > CATCH_UP_AFTER_MS
}
