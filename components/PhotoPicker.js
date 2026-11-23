'use client'
import { useRef, useState } from 'react'
import { uploadPhoto } from '@/lib/upload'
import { PHOTOS_MAX } from '@/lib/photos'

// Picking and uploading forum photos (up to 4; on phones, the camera or the gallery). Each is
// resized and uploaded at once (lib/upload.js); value / onChange hold the uploaded
// {full, thumb, w, h} list, onBusy tells the form to wait while uploads run.
//   usePhotoUploads: the logic, for the chat's message bar (its 📷 sits inside the bar)
//   PhotoPreviews:   the previews with ✕
//   PhotoPicker:     both with a "📷 ఫోటో" button, for the new-thread form
export function usePhotoUploads({ value, onChange, onBusy }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(0)
  const [error, setError] = useState('')
  const room = PHOTOS_MAX - value.length - busy

  async function picked(e) {
    const files = [...e.target.files].slice(0, Math.max(0, room))
    e.target.value = ''
    if (!files.length) return
    setError('')
    setBusy((n) => n + files.length)
    onBusy && onBusy(true)
    let list = value
    for (const file of files) {
      try {
        const photo = await uploadPhoto(file)
        list = [...list, photo]
        onChange(list)
      } catch (err) {
        setError(err.message)
      } finally {
        setBusy((n) => n - 1)
      }
    }
    onBusy && onBusy(false)
  }

  const fileInput = <input ref={input} type="file" accept="image/*" multiple hidden onChange={picked} />
  return { fileInput, open: () => input.current && input.current.click(), busy, error, room }
}

export function PhotoPreviews({ value, onChange, busy }) {
  if (!value.length && !busy) return null
  return (
    <div className="rb-photo-previews">
      {value.map((p, i) => (
        <span className="rb-photo-preview" key={p.full}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.thumb} alt="" />
          <button type="button" aria-label="ఈ ఫోటో తీసేయండి" onClick={() => onChange(value.filter((_, j) => j !== i))}>✕</button>
        </span>
      ))}
      {Array.from({ length: busy }, (_, i) => <span className="rb-photo-preview rb-photo-loading" key={`b${i}`} aria-label="ఫోటో పంపుతున్నాం" />)}
    </div>
  )
}

export default function PhotoPicker({ value, onChange, onBusy }) {
  const up = usePhotoUploads({ value, onChange, onBusy })
  return (
    <div className="rb-photos-pick">
      <PhotoPreviews value={value} onChange={onChange} busy={up.busy} />
      {up.fileInput}
      {up.room > 0 && (
        <button type="button" className="rb-photo-add" onClick={up.open}>
          <i className="fas fa-camera" aria-hidden="true"></i> ఫోటో{value.length ? ` (${value.length}/${PHOTOS_MAX})` : ''}
        </button>
      )}
      {up.error && <span className="rb-error" role="alert">{up.error}</span>}
    </div>
  )
}
