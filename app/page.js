import Link from 'next/link'
import TitleBand from '@/components/TitleBand'
import Chips from '@/components/Chips'
import ChatList from '@/components/chat/ChatList'
import { listThreads, parseId } from '@/lib/forum'
import { readDb, writeDb } from '@/lib/db'
import { unreadCounts } from '@/lib/reads'
import { currentMe } from '@/lib/me'

// The front page as a chat list (like WhatsApp's): every thread with its newest message, latest
// activity first, filtered by the chips (?words=1, ?region=X) or a word (?word=X, from a word
// page), paged with ?page=N. Phones: the list, with a floating "కొత్త చర్చ". Desktop: the list on
// the left, the రచ్చబండ welcome on the right until a thread is opened.
export default async function Home({ searchParams }) {
  const sp = await searchParams
  const one = (v) => (Array.isArray(v) ? v[0] : v) || ''
  const word = one(sp.word).trim().slice(0, 100)
  const region = one(sp.region).trim().slice(0, 100)
  const words = one(sp.words) === '1'
  const page = parseId(one(sp.page)) || 1

  const me = await currentMe()
  const { threads, more } = await listThreads(readDb(), { word, region, words, page }, me.user?.id)
  const unread = await unreadCounts(writeDb(), me.user?.id, threads.map((t) => t.id))

  const query = (extra) => {
    const q = new URLSearchParams()
    if (word) q.set('word', word)
    if (region) q.set('region', region)
    if (words) q.set('words', '1')
    for (const [k, v] of Object.entries(extra)) q.set(k, v)
    return `/?${q}`
  }
  const newHref = word ? `/racchabanda/new?word=${encodeURIComponent(word)}` : '/racchabanda/new'

  return (
    <div className="rb-chat-page rb-chat-page-list">
      <aside className="rb-chat-side" aria-label="చర్చలు">
        <div className="rb-chat-side-head">
          <h1 className="rb-chat-side-title">రచ్చబండ <span className="rb-chat-side-tag">ఊరంతా మాట్లాడుకునే చోటు</span></h1>
          <a className="rb-btn rb-btn-primary rb-btn-small rb-desktop-only" href={newHref}>+ కొత్త చర్చ</a>
        </div>
        {word ? (
          <p className="rb-filter">
            <a className="rb-chip-word" href={`/yaasa/${encodeURIComponent(word)}`}>పదం: {word}</a> గురించి చర్చలు ·{' '}
            <Link href="/">అన్నీ చూడండి</Link>
          </p>
        ) : (
          <Chips region={region} words={words} />
        )}

        {threads.length ? (
          <ChatList threads={threads} unread={unread} />
        ) : (
          <p className="rb-empty">
            {page > 1 ? 'ఇంకా చర్చలు లేవు.' : 'ఇక్కడ ఇంకా చర్చ లేదు. మొదటి మాట మీదే కావచ్చు!'}{' '}
            <a href={newHref}>కొత్త చర్చ మొదలుపెట్టండి →</a>
          </p>
        )}
        {more && (
          <div className="rb-more">
            <Link className="rb-btn rb-btn-outline" href={query({ page: String(page + 1) })}>ఇంకా చూపించు</Link>
          </div>
        )}
      </aside>

      <section className="rb-chat-welcome" aria-label="రచ్చబండ">
        <TitleBand newHref={newHref} />
        <p className="rb-chat-welcome-hint">ఎడమ వైపు ఒక చర్చ ఎంచుకోండి, లేదా కొత్తది మొదలుపెట్టండి.</p>
      </section>

      <a className="rb-fab" href={newHref}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"></path></svg>
        కొత్త చర్చ
      </a>
    </div>
  )
}
