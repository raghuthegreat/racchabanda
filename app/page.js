import Link from 'next/link'
import TitleBand from '@/components/TitleBand'
import Chips from '@/components/Chips'
import ThreadRow from '@/components/ThreadRow'
import { listThreads, parseId } from '@/lib/forum'
import { readDb } from '@/lib/db'
import { currentMe } from '@/lib/me'

// The front page: one open stream of threads, latest activity first, filtered by the chips
// (?words=1, ?region=X) or by a word (?word=X, from a word page), paged with ?page=N.
export default async function Home({ searchParams }) {
  const sp = await searchParams
  const one = (v) => (Array.isArray(v) ? v[0] : v) || ''
  const word = one(sp.word).trim().slice(0, 100)
  const region = one(sp.region).trim().slice(0, 100)
  const words = one(sp.words) === '1'
  const page = parseId(one(sp.page)) || 1

  const me = await currentMe()
  const { threads, more } = await listThreads(readDb(), { word, region, words, page }, me.user?.id)

  const query = (extra) => {
    const q = new URLSearchParams()
    if (word) q.set('word', word)
    if (region) q.set('region', region)
    if (words) q.set('words', '1')
    for (const [k, v] of Object.entries(extra)) q.set(k, v)
    return `/?${q}`
  }
  const now = new Date()
  const newHref = word ? `/racchabanda/new?word=${encodeURIComponent(word)}` : '/racchabanda/new'

  return (
    <div className="rb-wrap">
      <TitleBand newHref={newHref} />
      {word ? (
        <p className="rb-filter">
          <a className="rb-chip-word" href={`/yaasa/${encodeURIComponent(word)}`}>పదం: {word}</a> గురించి చర్చలు ·{' '}
          <Link href="/">అన్నీ చూడండి</Link>
        </p>
      ) : (
        <Chips region={region} words={words} />
      )}

      {threads.length ? (
        <div className="rb-list">
          {threads.map((t) => <ThreadRow key={t.id} thread={t} now={now} />)}
        </div>
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
    </div>
  )
}
