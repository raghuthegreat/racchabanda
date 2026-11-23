'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { send } from '@/lib/client'
import { BODY_MAX } from '@/lib/text'
import { saveDraft, takeDraft, replyDraftKey } from '@/lib/drafts'
import PhotoPicker from './PhotoPicker'

// The reply box, shown to everyone: an open box invites people in. "yc-text" is the class the
// site's Telugu typing (/Static/scripts/telugu-typing.js) listens on, and .yt-toggle its అ / A
// switch. Logged out, the button opens the site's login pop-up (components/LoginPopup.js);
// what they typed is kept (lib/drafts.js) and put back here when they return from Google, for
// them to post themselves. Logged in (and photos on), "📷 ఫోటో" adds up to 4 photos; a reply
// may be only photos.
export default function ReplyBox({ threadId, loggedIn, photosOn = false }) {
  const router = useRouter()
  const box = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const key = replyDraftKey(threadId)

  useEffect(() => {
    if (!loggedIn) return
    const draft = takeDraft(key)
    if (draft && draft.body && box.current) {
      box.current.value = draft.body
      box.current.focus()
      box.current.scrollIntoView({ block: 'center' })
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
    if (!body && !photos.length) { setError('ఏదైనా రాయండి, లేదా ఫోటో పెట్టండి'); return }
    setBusy(true); setError('')
    const r = await send('POST', '/posts', { threadId, body, photos })
    setBusy(false)
    if (!r.ok) { setError(r.data.message || 'సేవ్ కాలేదు'); return }
    box.current.value = ''
    setPhotos([])
    router.refresh()
  }

  return (
    <form className="rb-reply" onSubmit={submit}>
      <label htmlFor="rb-reply-body" className="rb-reply-label">మీ మాట</label>
      <textarea id="rb-reply-body" name="body" ref={box} className="yc-text rb-input" rows={3} maxLength={BODY_MAX}
                placeholder="English అక్షరాలతో రాయండి, తెలుగులోకి మారుతుంది (amma → అమ్మ)" />
      {loggedIn && photosOn && <PhotoPicker value={photos} onChange={setPhotos} onBusy={setUploading} />}
      <div className="rb-reply-foot">
        <span className="yt-toggle"></span>
        <span className="rb-reply-note">
          {loggedIn ? 'జవాబు వస్తే 🔔 లో, ఈమెయిల్ లో తెలుస్తుంది' : 'మీ పేరుతో కనిపిస్తుంది. Google తో ఒక్క క్లిక్, కొత్త పాస్‌వర్డ్ అక్కర్లేదు.'}
        </span>
        {error && <span className="rb-error" role="alert">{error}</span>}
        <button type="submit" className="rb-btn rb-btn-primary" disabled={busy || uploading}>
          {loggedIn ? (busy ? 'పంపుతున్నాం…' : uploading ? 'ఫోటో పంపుతున్నాం…' : 'పోస్ట్ చేయండి') : <><i className="fab fa-google" aria-hidden="true"></i> లాగిన్ అయి పోస్ట్ చేయండి</>}
        </button>
      </div>
    </form>
  )
}
