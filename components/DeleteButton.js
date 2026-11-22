'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { send } from '@/lib/client'

// Delete a reply (what="post") or a thread (what="thread"). Shown only when the server says it
// is allowed; the route checks again. A deleted thread goes back to the stream.
export default function DeleteButton({ what, id }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function remove() {
    if (!window.confirm(what === 'thread' ? 'ఈ చర్చను తీసేయాలా?' : 'ఈ జవాబును తీసేయాలా?')) return
    setBusy(true); setError('')
    const r = await send('DELETE', `/${what === 'thread' ? 'threads' : 'posts'}/${id}`)
    setBusy(false)
    if (!r.ok) { setError(r.data.message || 'తీసేయలేకపోయాం'); return }
    if (what === 'thread') router.push('/')
    else router.refresh()
  }

  return (
    <>
      <button type="button" className="rb-delete" onClick={remove} disabled={busy}>
        <i className="far fa-trash-alt" aria-hidden="true"></i> తీసేయండి
      </button>
      {error && <span className="rb-error" role="alert">{error}</span>}
    </>
  )
}
