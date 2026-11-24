import { cache } from 'react'
import { notFound, permanentRedirect } from 'next/navigation'
import ReplyBox from '@/components/ReplyBox'
import Bubble from '@/components/chat/Bubble'
import ChatBar from '@/components/chat/ChatBar'
import ChatList from '@/components/chat/ChatList'
import MarkRead from '@/components/chat/MarkRead'
import { getThread, listThreads, parseId } from '@/lib/forum'
import { readDb, writeDb } from '@/lib/db'
import { unreadCounts } from '@/lib/reads'
import { currentMe } from '@/lib/me'
import { threadPath } from '@/lib/text'
import { chatItems, clockTime, dayLabel } from '@/lib/chat'
import { DELETE_WINDOW_MS, EDIT_WINDOW_MS } from '@/lib/write'
import { photoBase } from '@/lib/photos'

// A thread as a chat: /racchabanda/t/<id>/<slug>. Any other slug (or none: the word page links
// /t/<id>) redirects to the thread's own address, so each thread has one URL.
// Phones: the conversation fills the screen (a compact chat bar instead of the site's header,
// the message bar at the bottom). Desktop: the chat list on the left, the conversation on the
// right, inside the site's header (app/forum.css .rb-chat-page).

// One load per request, shared by the metadata and the page (React cache); null = no thread
const loadThread = cache(async (id) => {
  const tid = parseId(id)
  if (!tid) return null
  const me = await currentMe()
  return getThread(readDb(), tid, me.user?.id)
})

function decoded(segments) {
  try { return (segments || []).map((s) => decodeURIComponent(s)).join('/') } catch (e) { return '' }
}

// A missing thread gets no metadata here; the page itself answers 404 (calling notFound() in
// both made Next.js send the 404 page's body only as script data)
export async function generateMetadata({ params }) {
  const data = await loadThread((await params).id)
  if (!data) return {}
  const { thread } = data
  const path = `/racchabanda${threadPath(thread)}`
  return {
    title: `${thread.title} · రచ్చబండ`,
    description: (thread.body || thread.title).replace(/\s+/g, ' ').slice(0, 160),
    alternates: { canonical: path },
    openGraph: { title: thread.title, url: path, type: 'article' },
  }
}

export default async function ThreadPage({ params }) {
  const { id, slug } = await params
  const data = await loadThread(id)
  if (!data) notFound()
  const me = await currentMe()
  const { thread, stickers, posts } = data
  const want = threadPath(thread)
  // Compare in one form: the address's slug segments, decoded then encoded like threadPath
  const have = `/t/${thread.id}${slug && slug.length ? '/' + encodeURIComponent(decoded(slug)) : ''}`
  if (have !== want) permanentRedirect(want)

  const now = new Date()
  const meId = me.user?.id || null
  const loggedIn = !!me.user
  const { threads } = await listThreads(readDb(), {}, meId)   // the desktop's left pane
  // Unread counts for the list, and where this thread's new messages start (logged in only)
  const unread = await unreadCounts(writeDb(), meId, [...new Set([...threads.map((t) => t.id), thread.id])])
  const firstUnread = unread.get(thread.id)?.firstUnread || null
  // What lib/write.js would allow (the routes check again)
  const age = (row) => now - new Date(row.created_at)
  const mayEdit = (row) => !!meId && row.author_id === meId && age(row) <= EDIT_WINDOW_MS
  const mayDelete = (row, isThread) => !!me.user && (me.user.admin || (row.author_id === meId
    && age(row) <= DELETE_WINDOW_MS && (!isThread || thread.reply_count === 0)))
  const people = new Set([thread.author_id, ...posts.map((p) => p.author_id)]).size

  return (
    <div className="rb-chat-page">
      <aside className="rb-chat-side" aria-label="చర్చలు">
        <div className="rb-chat-side-head">
          <h2 className="rb-chat-side-title">రచ్చబండ</h2>
          <a className="rb-btn rb-btn-primary rb-btn-small" href="/racchabanda/new">+ కొత్త చర్చ</a>
        </div>
        <ChatList threads={threads} activeId={thread.id} now={now} unread={unread} />
      </aside>

      <section className="rb-chat" aria-label={thread.title}>
        <ChatBar thread={thread} messages={posts.length + 1} people={people} />
        <div className="rb-chat-scroll">
          <Bubble kind="thread" threadId={thread.id} id={thread.id} authorName={thread.author_name} authorPic={thread.author_pic}
                  title={thread.title} body={thread.body} photos={thread.photos}
                  time={`${dayLabel(thread.created_at, now)}, ${clockTime(thread.created_at)}`} edited={!!thread.edited_at}
                  initialStickers={stickers} loggedIn={loggedIn} editable={mayEdit(thread)} deletable={mayDelete(thread, true)}>
            {(thread.word || thread.region || thread.source === 'instagram') && (
              <div className="rb-topic-tags">
                {thread.word && <a className="rb-chip-word" href={`/yaasa/${encodeURIComponent(thread.word)}`}>పదం: {thread.word} → నిఘంటువులో చూడండి</a>}
                {thread.region && <a className="rb-chip-region" href={`/racchabanda?region=${encodeURIComponent(thread.region)}`}>{thread.region}</a>}
                {thread.source === 'instagram' && <span className="rb-when">Instagram నుండి</span>}
              </div>
            )}
          </Bubble>

          {chatItems(posts, meId, now).flatMap((item, i) => (item.type === 'day'
            ? [<div className="rb-day" key={`d${i}`}><span>{item.label}</span></div>]
            : [item.post.id === firstUnread && <div className="rb-unread-line" id="rb-unread" key="unread"><span>కొత్త మాటలు</span></div>,
               <Bubble key={item.post.id} threadId={thread.id} id={item.post.id} authorName={item.post.author_name} authorPic={item.post.author_pic}
                      body={item.post.body} photos={item.post.photos} time={item.time} edited={!!item.post.edited_at}
                      mine={item.mine} first={item.first} last={item.last} initialStickers={item.post.stickers} loggedIn={loggedIn}
                      editable={mayEdit(item.post)} deletable={mayDelete(item.post, false)} />]))}
          {posts.length === 0 && <p className="rb-chat-empty">ఇంకా ఎవరూ జవాబు చెప్పలేదు. మొదటి మాట మీదే!</p>}
          <div id="rb-chat-end" />
        </div>
        <ReplyBox threadId={thread.id} loggedIn={loggedIn} photosOn={!!photoBase()} />
        {loggedIn && <MarkRead threadId={thread.id} firstUnread={firstUnread} />}
      </section>
    </div>
  )
}
