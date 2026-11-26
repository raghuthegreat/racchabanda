'use client'
import { useEffect, useRef, useState } from 'react'
import { send, LOGIN_URL } from '@/lib/client'

// A post's stickers (the topic: postId null, or a reply) and tap-to-toggle: adds yours, or takes
// it back. Logged out, a tap opens the site's login pop-up (components/LoginPopup.js).
// When the page refreshes with new counts (others' stickers, live updates), they replace these,
// unless your own tap is still on its way.
export default function useStickers({ threadId, postId = null, initial, loggedIn }) {
  const [stickers, setStickers] = useState(initial || [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fresh = JSON.stringify(initial || [])
  const seen = useRef(fresh)
  useEffect(() => {
    if (fresh === seen.current || busy) return
    seen.current = fresh
    setStickers(JSON.parse(fresh))
  }, [fresh, busy])

  async function toggle(code) {
    if (!loggedIn) {
      if (window.yLogin) window.yLogin('forum_sticker'); else window.location.href = LOGIN_URL
      return false
    }
    if (busy) return false
    setBusy(true); setError('')
    const r = await send('POST', '/stickers', { threadId, postId, sticker: code })
    setBusy(false)
    if (!r.ok) { setError(r.data.message || 'కాలేదు'); return false }
    setStickers(r.data.stickers || [])
    return true
  }

  return { stickers, toggle, busy, error }
}
