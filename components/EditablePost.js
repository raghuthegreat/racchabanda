'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { send } from '@/lib/client'
import { TITLE_MAX, BODY_MAX } from '@/lib/text'

// A post's text with "సవరించండి" for its writer (within 2 days: the page decides, the route
// checks again). Editing opens the text in place (and the title, for a thread's first post)
// with సేవ్ / రద్దు. A thread's new title can change its address, so a saved thread goes to the
// address the route returns; a saved reply just refreshes.
export default function EditablePost({ kind, id, title = '', body = '', editable, children }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!editing) {
    return (
      <>
        {children}
        {editable && (
          <button type="button" className="rb-edit" onClick={() => setEditing(true)}>
            <i className="far fa-edit" aria-hidden="true"></i> సవరించండి
          </button>
        )}
      </>
    )
  }

  async function save(e) {
    e.preventDefault()
    const f = e.currentTarget.elements
    const payload = kind === 'thread' ? { title: f.title.value, body: f.body.value } : { body: f.body.value }
    setBusy(true); setError('')
    const r = await send('PATCH', `/${kind === 'thread' ? 'threads' : 'posts'}/${id}`, payload)
    setBusy(false)
    if (!r.ok) { setError(r.data.message || 'సేవ్ కాలేదు'); return }
    setEditing(false)
    if (kind === 'thread') router.push(r.data.path)
    else router.refresh()
  }

  return (
    <form className="rb-edit-form" onSubmit={save}>
      {kind === 'thread' && (
        <input name="title" className="yc-text rb-input" defaultValue={title} maxLength={TITLE_MAX} required aria-label="శీర్షిక" />
      )}
      <textarea name="body" className="yc-text rb-input" defaultValue={body} rows={4} maxLength={BODY_MAX}
                required={kind !== 'thread'} aria-label="మీ మాట" autoFocus />
      <div className="rb-reply-foot">
        <span className="yt-toggle"></span>
        {error && <span className="rb-error" role="alert">{error}</span>}
        <button type="button" className="rb-btn rb-btn-outline" onClick={() => { setEditing(false); setError('') }} disabled={busy}>రద్దు</button>
        <button type="submit" className="rb-btn rb-btn-primary" disabled={busy}>{busy ? 'సేవ్ చేస్తున్నాం…' : 'సేవ్'}</button>
      </div>
    </form>
  )
}
