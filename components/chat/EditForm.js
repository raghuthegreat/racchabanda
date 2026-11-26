'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { send } from '@/lib/client'
import { TITLE_MAX, BODY_MAX } from '@/lib/text'

// Editing a post in place (the writer, within 2 days; the route checks again): the text, and the
// title too for the topic. A saved topic goes to the address the route returns (a new title can
// change it); a saved reply just refreshes.
export default function EditForm({ kind, id, title = '', body = '', onDone }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save(e) {
    e.preventDefault()
    const f = e.currentTarget.elements
    const payload = kind === 'thread' ? { title: f.title.value, body: f.body.value } : { body: f.body.value }
    setBusy(true); setError('')
    const r = await send('PATCH', `/${kind === 'thread' ? 'threads' : 'posts'}/${id}`, payload)
    setBusy(false)
    if (!r.ok) { setError(r.data.message || 'సేవ్ కాలేదు'); return }
    onDone()
    if (kind === 'thread') router.push(r.data.path)
    else router.refresh()
  }

  return (
    <form className="rb-edit-form" onSubmit={save} onClick={(e) => e.stopPropagation()}>
      {kind === 'thread' && <input name="title" className="yc-text rb-input" defaultValue={title} maxLength={TITLE_MAX} required aria-label="శీర్షిక" />}
      <textarea name="body" className="yc-text rb-input" defaultValue={body} rows={3} maxLength={BODY_MAX} aria-label="మీ మాట" autoFocus />
      <div className="rb-edit-foot">
        {error && <span className="rb-error" role="alert">{error}</span>}
        <button type="button" className="rb-btn rb-btn-outline" onClick={onDone} disabled={busy}>రద్దు</button>
        <button type="submit" className="rb-btn rb-btn-primary" disabled={busy}>{busy ? 'సేవ్…' : 'సేవ్'}</button>
      </div>
    </form>
  )
}
