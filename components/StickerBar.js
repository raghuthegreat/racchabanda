'use client'
import { useState } from 'react'
import StickerChip from './StickerChip'
import { STICKERS } from '@/lib/stickers'
import { send, LOGIN_URL } from '@/lib/client'

// A post's stickers (the first post: postId null, or a reply): tap one to add yours or take it
// back, "+" opens all eight. Logged out, they lead to the login page.
export default function StickerBar({ threadId, postId = null, initial, loggedIn }) {
  const [stickers, setStickers] = useState(initial || [])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function tap(code) {
    if (!loggedIn) { window.location.href = LOGIN_URL; return }
    if (busy) return
    setBusy(true); setError('')
    const r = await send('POST', '/stickers', { threadId, postId, sticker: code })
    setBusy(false)
    if (r.ok) { setStickers(r.data.stickers || []); setOpen(false) } else setError(r.data.message || 'కాలేదు')
  }

  return (
    <div className="rb-stickers">
      {stickers.map((s) => (
        <button key={s.code} type="button" className="rb-sticker-btn" onClick={() => tap(s.code)} aria-pressed={s.mine} disabled={busy}
                title={s.mine ? 'మీ స్టిక్కర్ తీసేయండి' : 'మీరూ ఇవ్వండి'}>
          <StickerChip {...s} />
        </button>
      ))}
      <button type="button" className="rb-sticker-add" onClick={() => (loggedIn ? setOpen(!open) : (window.location.href = LOGIN_URL))}
              aria-expanded={open} aria-label="స్టిక్కర్ ఇవ్వండి" title="స్టిక్కర్ ఇవ్వండి">+</button>
      {open && (
        <div className="rb-picker" role="group" aria-label="స్టిక్కర్లు">
          {STICKERS.map((s) => (
            <button key={s.code} type="button" className="rb-sticker-btn" onClick={() => tap(s.code)} disabled={busy}>
              <StickerChip label={s.label} tone={s.tone} mine={stickers.some((x) => x.code === s.code && x.mine)} />
            </button>
          ))}
        </div>
      )}
      {error && <span className="rb-error" role="alert">{error}</span>}
    </div>
  )
}
