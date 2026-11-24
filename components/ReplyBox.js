'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { send } from '@/lib/client'
import { BODY_MAX } from '@/lib/text'
import { saveDraft, takeDraft, replyDraftKey } from '@/lib/drafts'
import { usePhotoUploads, PhotoPreviews } from './PhotoPicker'

// The chat's message bar, at the bottom of the conversation: 📷, a box that grows as you type
// (Telugu typing: class "yc-text" and the అ / A switch .yt-toggle, from the site's
// /Static/scripts/telugu-typing.js), and ➤. A reply may be only photos.
// Logged out, ➤ reads "లాగిన్ అయి పంపండి": it opens the site's login pop-up and what was typed is
// kept (lib/drafts.js) and put back here after Google, for them to send themselves.
const MAX_LINES_PX = 140

export default function ReplyBox({ threadId, loggedIn, photosOn = false }) {
  const router = useRouter()
  const box = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const up = usePhotoUploads({ value: photos, onChange: setPhotos, onBusy: setUploading })
  const key = replyDraftKey(threadId)

  const grow = () => {
    const t = box.current
    if (!t) return
    t.style.height = 'auto'
    t.style.height = `${Math.min(t.scrollHeight, MAX_LINES_PX)}px`
  }

  useEffect(() => {
    if (!loggedIn) return
    const draft = takeDraft(key)
    if (draft && draft.body && box.current) {
      box.current.value = draft.body
      grow()
      box.current.focus()
    }
  }, [key, loggedIn])

  async function submit(e) {
    e.preventDefault()
    const body = box.current.value.trim()
    if (!loggedIn) {
      const keep = () => saveDraft(key, { body })
      if (window.yLogin) window.yLogin('forum_reply', { onGo: keep })
      else { keep(); window.location.href = '/login' }
      return
    }
    if (!body && !photos.length) { box.current.focus(); return }
    setBusy(true); setError('')
    const r = await send('POST', '/posts', { threadId, body, photos })
    setBusy(false)
    if (!r.ok) { setError(r.data.message || 'పంపలేకపోయాం'); return }
    box.current.value = ''
    grow()
    setPhotos([])
    router.refresh()
    // The new message lands at the end of the conversation
    setTimeout(() => document.getElementById('rb-chat-end')?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 700)
  }

  const canPhoto = loggedIn && photosOn && up.room > 0
  return (
    <form className="rb-composer" onSubmit={submit}>
      {(photos.length > 0 || up.busy > 0) && <PhotoPreviews value={photos} onChange={setPhotos} busy={up.busy} />}
      {(error || up.error) && <span className="rb-error" role="alert">{error || up.error}</span>}
      <div className="rb-bar">
        {up.fileInput}
        {canPhoto && (
          <button type="button" className="rb-bar-icon" onClick={up.open} aria-label="ఫోటో పెట్టండి" title="ఫోటో">
            <i className="fas fa-camera" aria-hidden="true"></i>
          </button>
        )}
        <div className="rb-bar-field">
          <textarea id="rb-reply-body" name="body" ref={box} className="yc-text rb-bar-input" rows={1} maxLength={BODY_MAX}
                    placeholder="మీ మాట…" aria-label="మీ మాట" onInput={grow} />
          <span className="yt-toggle"></span>
        </div>
        {loggedIn ? (
          <button type="submit" className="rb-bar-send" disabled={busy || uploading} aria-label={uploading ? 'ఫోటో పంపుతున్నాం' : 'పంపండి'} title="పంపండి">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 20.5 21 12 3 3.5 3 10l12 2-12 2z"></path></svg>
          </button>
        ) : (
          <button type="submit" className="rb-btn rb-btn-primary rb-bar-login">
            <i className="fab fa-google" aria-hidden="true"></i> లాగిన్ అయి పంపండి
          </button>
        )}
      </div>
      {!loggedIn && <span className="rb-reply-note">మీ పేరుతో కనిపిస్తుంది. Google తో ఒక్క క్లిక్, కొత్త పాస్‌వర్డ్ అక్కర్లేదు.</span>}
    </form>
  )
}
