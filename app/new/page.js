import Link from 'next/link'
import NewThreadForm from '@/components/NewThreadForm'
import { currentMe } from '@/lib/me'
import { ALL_REGION_IDS } from '@/lib/regions'

export const metadata = { title: 'కొత్త చర్చ · రచ్చబండ', robots: { index: false } }

// /racchabanda/new?word=<word>&region=<region>: the word page's "ఈ పదం గురించి మాట్లాడండి"
// fills in the word. Logged out the form shows too; its button opens the login pop-up and
// what was typed is kept for when they come back (the site's login returns here).
export default async function NewThread({ searchParams }) {
  const sp = await searchParams
  const one = (v) => (Array.isArray(v) ? v[0] : v) || ''
  const word = one(sp.word).trim().slice(0, 100)
  const region = ALL_REGION_IDS.includes(one(sp.region)) ? one(sp.region) : ''
  const me = await currentMe()
  return (
    <div className="rb-wrap rb-thread">
      <Link className="rb-back" href="/">← రచ్చబండ</Link>
      <h1 className="rb-thread-title">కొత్త చర్చ</h1>
      <NewThreadForm word={word} region={region} loggedIn={!!me.user} />
    </div>
  )
}
