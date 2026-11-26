'use client'
import { useEffect, useRef, useState } from 'react'

// A person's Google photo, or the first letter of their name on one of the brand's soft tones
// (picked from the name, so a person keeps their colour). Sizes in px. Google photo addresses
// change and old ones stop loading (backlog #40): a photo that fails falls back to the letter.
// The page is rendered on the server, so the browser may fail the image before React listens:
// after mounting, an image that already failed (complete, no size) counts as failed too.
const TONES = ['mud', 'leaf', 'thatch', 'sunk']

export default function Avatar({ name, pic, size = 40 }) {
  const [failed, setFailed] = useState(false)
  const img = useRef(null)
  useEffect(() => {
    const el = img.current
    if (el && el.complete && el.naturalWidth === 0) setFailed(true)
  }, [pic])
  const label = name || 'ఎవరో'
  const style = { width: size, height: size, fontSize: Math.round(size * 0.45) }
  if (pic && pic.startsWith('http') && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img ref={img} className="rb-avatar" src={pic} alt="" style={style} referrerPolicy="no-referrer" onError={() => setFailed(true)} />
  }
  const tone = TONES[(label.codePointAt(0) || 0) % TONES.length]
  return <span className={`rb-avatar rb-avatar-${tone}`} style={style} aria-hidden="true">{[...label][0]}</span>
}
