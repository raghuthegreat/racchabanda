'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { send } from '@/lib/client'
import { REGIONS, regionId, regionLabel } from '@/lib/regions'
import { TITLE_MAX, BODY_MAX } from '@/lib/text'
import { saveDraft, takeDraft, NEW_THREAD_DRAFT_KEY } from '@/lib/drafts'
import PhotoPicker from './PhotoPicker'

// Start a thread: a title, what you want to say, and optionally the word it is about (filled in
// when coming from a word page) and a region. Text fields type Telugu like the site (yc-text).
// Shown logged out too: the button opens the site's login pop-up, and all four fields are kept
// (lib/drafts.js) and put back when they return from Google.
export default function NewThreadForm({ word = '', region = '', loggedIn, photosOn = false }) {
  const router = useRouter()
  const form = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!loggedIn) return
    const draft = takeDraft(NEW_THREAD_DRAFT_KEY)
    if (!draft || !form.current) return
    const f = form.current.elements
    for (const name of ['title', 'body', 'word', 'region']) {
      if (typeof draft[name] === 'string' && draft[name]) f[name].value = draft[name]
    }
    f.title.focus()
  }, [loggedIn])

  async function submit(e) {
    e.preventDefault()
    const f = e.currentTarget.elements
    const input = { title: f.title.value, body: f.body.value, word: f.word.value, region: f.region.value }
    if (!loggedIn) {
      const keep = () => saveDraft(NEW_THREAD_DRAFT_KEY, input)
      if (window.yLogin) window.yLogin('forum_thread', { onGo: keep })
      else { keep(); window.location.href = '/login' }
      return
    }
    if (!input.title.trim()) { setError('శీర్షిక రాయండి'); return }
    setBusy(true); setError('')
    const r = await send('POST', '/threads', { ...input, photos })
    if (!r.ok) { setBusy(false); setError(r.data.message || 'సేవ్ కాలేదు'); return }
    router.push(r.data.path)
  }

  return (
    <form className="rb-form" onSubmit={submit} ref={form}>
      <label htmlFor="rb-title">శీర్షిక</label>
      <input id="rb-title" name="title" className="yc-text rb-input" maxLength={TITLE_MAX} required={loggedIn}
             placeholder='ఉదా: "బేగా" అంటే మీ ఊర్లో ఏమిటి?' />

      <label htmlFor="rb-body">మీ మాట</label>
      <textarea id="rb-body" name="body" className="yc-text rb-input" rows={6} maxLength={BODY_MAX}
                placeholder="English అక్షరాలతో రాయండి, తెలుగులోకి మారుతుంది (amma → అమ్మ)" />

      {loggedIn && photosOn && <PhotoPicker value={photos} onChange={setPhotos} onBusy={setUploading} />}

      <div className="rb-form-row">
        <div>
          <label htmlFor="rb-word">పదం (ఉంటే)</label>
          <input id="rb-word" name="word" className="yc-text rb-input" maxLength={100} defaultValue={word} placeholder="ఉదా: బేగా" />
        </div>
        <div>
          <label htmlFor="rb-region">ప్రాంతం (ఉంటే)</label>
          <select id="rb-region" name="region" className="rb-input" defaultValue={region}>
            <option value="">ఏదీ కాదు</option>
            {REGIONS.map(([main, places]) => (
              <optgroup key={regionId(main)} label={regionLabel(main)}>
                <option value={regionId(main)}>{regionLabel(main)}</option>
                {places.map((p) => <option key={regionId(p)} value={regionId(p)}>{regionLabel(p)}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="rb-form-foot">
        <span className="yt-toggle"></span>
        {!loggedIn && <span className="rb-reply-note">మీ పేరుతో కనిపిస్తుంది. Google తో ఒక్క క్లిక్, కొత్త పాస్‌వర్డ్ అక్కర్లేదు.</span>}
        {error && <span className="rb-error" role="alert">{error}</span>}
        <button type="submit" className="rb-btn rb-btn-primary" disabled={busy || uploading}>
          {loggedIn ? (busy ? 'పంపుతున్నాం…' : uploading ? 'ఫోటో పంపుతున్నాం…' : 'చర్చ మొదలుపెట్టండి') : <><i className="fab fa-google" aria-hidden="true"></i> లాగిన్ అయి చర్చ మొదలుపెట్టండి</>}
        </button>
      </div>
    </form>
  )
}
