// Unread counts (supabase/migrations/004_reads.sql). The reads are private, so these run with the
// forum's server key (lib/db.js writeDb). Never throws: if counting fails, the list just shows
// no counts.

// For the threads on screen that this person has opened before:
// Map(threadId -> {unread, firstUnread}), unread = replies by others since their last read
export async function unreadCounts(db, userId, threadIds) {
  const out = new Map()
  if (!userId || !threadIds || !threadIds.length) return out
  try {
    const { data, error } = await db.rpc('unread_counts', { p_user: userId, p_threads: threadIds })
    if (error || !Array.isArray(data)) return out
    for (const r of data) out.set(r.thread_id, { unread: r.unread || 0, firstUnread: r.first_unread ?? null })
  } catch (e) { /* no counts this time */ }
  return out
}
