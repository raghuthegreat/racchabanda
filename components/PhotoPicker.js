'use client'
import { useRef, useState } from 'react'
import { uploadPhoto } from '@/lib/upload'
import { PHOTOS_MAX } from '@/lib/photos'

// "📷 ఫోటో" for the reply box and the new-thread form: pick up to 4 photos (on phones, the camera
// or the gallery). Each is resized and uploaded at once (lib/upload.js); previews show with ✕
// to take one out before posting. value / onChange hold the uploaded {full, thumb, w, h} list;
// onBusy tells the form to wait while uploads run.
export default function PhotoPicker({ value, onChange, onBusy }) {
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

  return (
    <div className="rb-photos-pick">
      {(value.length > 0 || busy > 0) && (
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
      )}
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={picked} />
      {room > 0 && (
        <button type="button" className="rb-photo-add" onClick={() => input.current.click()}>
          <i className="fas fa-camera" aria-hidden="true"></i> ఫోటో{value.length ? ` (${value.length}/${PHOTOS_MAX})` : ''}
        </button>
      )}
      {error && <span className="rb-error" role="alert">{error}</span>}
    </div>
  )
}
