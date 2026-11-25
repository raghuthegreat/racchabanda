'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { send } from '@/lib/client'
import { threadEventMatters, listEventMatters, makeBatcher, needsCatchUp } from '@/lib/live'

// Live updates for an open page, through Supabase Realtime (005_realtime.sql). The browser only
// listens, with the public read-only key; when a change matters to this page (lib/live.js), the
// page refreshes once (Next.js re-renders it on the server), a burst of changes batched together.
//   threadId set: the thread page (someone else's reply, edit, deletion or sticker here; the
//     side list's threads on desktop). Logged in, the thread is recorded as read before the
//     refresh, so a reply you watched arrive never shows as unread. If you were at the end of
//     the conversation, it scrolls to the new message.
//   no threadId: the chat list (any thread's activity: it moves up, its last line and your
//     unread counts update).
// Back on the page after a while away (phones drop the connection when locked): refresh once.
let client = null
function liveClient(url, key) {
  if (!client) client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}

const WIDE = '(min-width: 992px)'   // the side list shows beside the conversation (app/forum.css)

function atEnd() {
  const end = document.getElementById('rb-chat-end')
  if (!end) return false
  const box = end.closest('.rb-chat-scroll')
  const bottom = box && box.scrollHeight > box.clientHeight ? box.getBoundingClientRect().bottom : window.innerHeight
  return end.getBoundingClientRect().top - bottom < 200
}

export default function Live({ url, anonKey, threadId = null, meId = null, postIds = [], lastPostId = null }) {
  const router = useRouter()
  const page = useRef({ meId, postIds })
  page.current = { meId, postIds }
  const followEnd = useRef(false)

  useEffect(() => {
    if (!url || !anonKey) return undefined
    const db = liveClient(url, anonKey)
    const wide = window.matchMedia(WIDE)
    let connected = false
    let hiddenAt = null

    const refresh = async () => {
      if (threadId) followEnd.current = atEnd()
      if (threadId && page.current.meId) await send('POST', '/reads', { threadId })
      router.refresh()
    }
    const batch = makeBatcher(refresh)
    const onChange = (e) => {
      const matters = threadId
        ? threadEventMatters(e, { threadId, ...page.current, wantList: wide.matches })
        : listEventMatters(e)
      if (matters) batch.push()
    }

    const pg = (table, event, filter) => ['postgres_changes', { event, schema: 'public', table, ...(filter ? { filter } : {}) }, onChange]
    const channel = db.channel(threadId ? `rb-thread-${threadId}` : 'rb-list')
    if (threadId) {
      channel.on(...pg('posts', 'INSERT', `thread_id=eq.${threadId}`))
             .on(...pg('posts', 'UPDATE', `thread_id=eq.${threadId}`))
             .on(...pg('posts', 'DELETE'))                     // deletes can't be filtered: checked against the page
             .on(...pg('reactions', 'INSERT', `thread_id=eq.${threadId}`))
             .on(...pg('threads', '*'))
    } else {
      channel.on(...pg('threads', '*'))
    }
    channel.subscribe((status) => { connected = status === 'SUBSCRIBED' })

    const onVisible = () => {
      if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); return }
      if (needsCatchUp({ hiddenAt, now: Date.now(), connected })) batch.push()
      hiddenAt = null
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      batch.cancel()
      document.removeEventListener('visibilitychange', onVisible)
      db.removeChannel(channel)
    }
  }, [url, anonKey, threadId, router])

  // A new message arrived while you were at the end of the conversation: follow it
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    if (followEnd.current) {
      followEnd.current = false
      document.getElementById('rb-chat-end')?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [lastPostId])

  return null
}
