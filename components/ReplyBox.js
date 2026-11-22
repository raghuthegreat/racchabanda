'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { send } from '@/lib/client'
import { BODY_MAX } from '@/lib/text'

// The reply box. "yc-text" is the class the site's Telugu typing (/Static/scripts/telugu-typing.js)
// listens on, and .yt-toggle its అ / A switch, so it types like the site's comment box.
export default function ReplyBox({ threadId }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    const box = e.currentTarget.elements.body
    const body = box.value.trim()
    if (!body) { setError('ఏదైనా రాయండి'); return }
    setBusy(true); setError('')
    const r = await send('POST', '/posts', { threadId, body })
    setBusy(false)
    if (!r.ok) { setError(r.data.message || 'సేవ్ కాలేదు'); return }
    box.value = ''
    router.refresh()
  }

  return (
    <form className="rb-reply" onSubmit={submit}>
      <label htmlFor="rb-reply-body" className="rb-reply-label">మీ మాట</label>
      <textarea id="rb-reply-body" name="body" className="yc-text rb-input" rows={3} maxLength={BODY_MAX}
                placeholder="English అక్షరాలతో రాయండి, తెలుగులోకి మారుతుంది (amma → అమ్మ)" />
      <div className="rb-reply-foot">
        <span className="yt-toggle"></span>
        <span className="rb-reply-note">జవాబు వస్తే 🔔 లో, ఈమెయిల్ లో తెలుస్తుంది</span>
        {error && <span className="rb-error" role="alert">{error}</span>}
        <button type="submit" className="rb-btn rb-btn-primary" disabled={busy}>{busy ? 'పంపుతున్నాం…' : 'పోస్ట్ చేయండి'}</button>
      </div>
    </form>
  )
}
