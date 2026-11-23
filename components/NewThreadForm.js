'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { send } from '@/lib/client'
import { REGIONS, regionId, regionLabel } from '@/lib/regions'
import { TITLE_MAX, BODY_MAX } from '@/lib/text'

// Start a thread: a title, what you want to say, and optionally the word it is about (filled in
// when coming from a word page) and a region. Text fields type Telugu like the site (yc-text).
export default function NewThreadForm({ word = '', region = '' }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    const f = e.currentTarget.elements
    const input = { title: f.title.value, body: f.body.value, word: f.word.value, region: f.region.value }
    if (!input.title.trim()) { setError('శీర్షిక రాయండి'); return }
    setBusy(true); setError('')
    const r = await send('POST', '/threads', input)
    if (!r.ok) { setBusy(false); setError(r.data.message || 'సేవ్ కాలేదు'); return }
    router.push(r.data.path)
  }

  return (
    <form className="rb-form" onSubmit={submit}>
      <label htmlFor="rb-title">శీర్షిక</label>
      <input id="rb-title" name="title" className="yc-text rb-input" maxLength={TITLE_MAX} required
             placeholder='ఉదా: "బేగా" అంటే మీ ఊర్లో ఏమిటి?' />

      <label htmlFor="rb-body">మీ మాట</label>
      <textarea id="rb-body" name="body" className="yc-text rb-input" rows={6} maxLength={BODY_MAX}
                placeholder="English అక్షరాలతో రాయండి, తెలుగులోకి మారుతుంది (amma → అమ్మ)" />

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
        {error && <span className="rb-error" role="alert">{error}</span>}
        <button type="submit" className="rb-btn rb-btn-primary" disabled={busy}>{busy ? 'పంపుతున్నాం…' : 'చర్చ మొదలుపెట్టండి'}</button>
      </div>
    </form>
  )
}
