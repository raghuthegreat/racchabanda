import { cache } from 'react'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import Avatar from '@/components/shared/Avatar'
import StickerChip from '@/components/StickerChip'
import PostText from '@/components/PostText'
import { getThread, parseId } from '@/lib/forum'
import { readDb } from '@/lib/db'
import { currentMe } from '@/lib/me'
import { threadPath, timeAgo } from '@/lib/text'

// A thread: /racchabanda/t/<id>/<slug>. Any other slug (or none: the word page links
// /t/<id>) redirects to the thread's own address, so each thread has one URL.

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
  return (
    <div className="rb-wrap rb-thread">
      <Link className="rb-back" href="/">← రచ్చబండ</Link>
      <h1 className="rb-thread-title">{thread.title}</h1>
      <div className="rb-row-meta">
        {thread.word && <a className="rb-chip-word" href={`/yaasa/${encodeURIComponent(thread.word)}`}>పదం: {thread.word} → నిఘంటువులో చూడండి</a>}
        {thread.region && <Link className="rb-chip-region" href={`/?region=${encodeURIComponent(thread.region)}`}>{thread.region}</Link>}
        {thread.source === 'instagram' && <span>Instagram నుండి</span>}
      </div>

      <article className="rb-post rb-post-first">
        <header className="rb-post-head">
          <Avatar name={thread.author_name} pic={thread.author_pic} size={42} />
          <span><strong className="rb-who">{thread.author_name || 'ఎవరో'}</strong><span className="rb-when">{timeAgo(thread.created_at, now)}</span></span>
        </header>
        {thread.body && <PostText text={thread.body} />}
        {stickers.length > 0 && <div className="rb-stickers">{stickers.map((s) => <StickerChip key={s.code} {...s} />)}</div>}
      </article>

      {posts.length > 0 && (
        <section className="rb-replies" aria-label={`${posts.length} జవాబులు`}>
          {posts.map((p) => (
            <article className="rb-post" key={p.id} id={`post-${p.id}`}>
              <header className="rb-post-head">
                <Avatar name={p.author_name} pic={p.author_pic} size={34} />
                <span><strong className="rb-who">{p.author_name || 'ఎవరో'}</strong><span className="rb-when">{timeAgo(p.created_at, now)}</span></span>
              </header>
              <PostText text={p.body} />
              {p.stickers.length > 0 && <div className="rb-stickers">{p.stickers.map((s) => <StickerChip key={s.code} {...s} />)}</div>}
            </article>
          ))}
        </section>
      )}

      {!me.user && (
        <p className="rb-login">జవాబు రాయడానికి, స్టిక్కర్ ఇవ్వడానికి <a href="/login">Google తో లాగిన్ అవ్వండి</a>.</p>
      )}
    </div>
  )
}
