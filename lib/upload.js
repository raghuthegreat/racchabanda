// Browser only: turn a picked photo into a forum photo {full, thumb, w, h}.
// 1. Draw it on a canvas at FULL_PX (and THUMB_PX) on its longest side and encode a new JPEG.
//    Drawing through an <img> applies the phone's rotation (EXIF orientation), and the new file
//    carries none of the original's EXIF, so the photo's GPS location never leaves the phone.
// 2. Ask the site for signed uploads (yaasa /api/forum/photo, the visitor's own login cookie).
// 3. Upload both files straight to S3; S3 enforces type, size and name from the signature.
import { FULL_PX, THUMB_PX, PHOTO_QUALITY, fitSize } from './photos.js'

const MAX_BYTES = 1536 * 1024

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')) }
    img.src = url
  })
}

function encode(img, max, quality) {
  const { w, h } = fitSize(img.naturalWidth, img.naturalHeight, max)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'                 // transparent PNGs become white, not black, as JPEG
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve({ blob, w, h }), 'image/jpeg', quality))
}

// Resized JPEGs, re-encoded at lower quality if a photo is still over the cap
export async function preparePhoto(file) {
  const { img, url } = await loadImage(file)
  try {
    let full = await encode(img, FULL_PX, PHOTO_QUALITY)
    for (const q of [0.75, 0.6]) {
      if (full.blob && full.blob.size <= MAX_BYTES) break
      full = await encode(img, FULL_PX, q)
    }
    const thumb = await encode(img, THUMB_PX, 0.8)
    if (!full.blob || !thumb.blob || full.blob.size > MAX_BYTES) throw new Error('too big')
    return { full: full.blob, thumb: thumb.blob, w: full.w, h: full.h }
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function put(target, blob) {
  const form = new FormData()
  for (const [k, v] of Object.entries(target.fields)) form.append(k, v)
  form.append('file', blob)              // the file goes last (S3's rule)
  const r = await fetch(target.post, { method: 'POST', body: form })
  if (!r.ok) throw new Error(`s3 ${r.status}`)
  return target.url
}

// A picked file -> {full, thumb, w, h} on S3. Throws an Error with a Telugu message.
export async function uploadPhoto(file) {
  let prepared
  try { prepared = await preparePhoto(file) } catch (e) {
    throw new Error('ఈ ఫోటో తెరవలేకపోయాం. వేరే ఫోటో ప్రయత్నించండి.')
  }
  const r = await fetch('/api/forum/photo', {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'image/jpeg' }),
  })
  if (!r.ok) {
    let message = 'ఫోటో పంపలేకపోయాం.'
    try { message = (await r.json()).message || message } catch (e) { /* keep the default */ }
    throw new Error(message)
  }
  const signed = await r.json()
  try {
    const [full, thumb] = await Promise.all([put(signed.full, prepared.full), put(signed.thumb, prepared.thumb)])
    return { full, thumb, w: prepared.w, h: prepared.h }
  } catch (e) {
    throw new Error('ఫోటో పంపలేకపోయాం. మళ్ళీ ప్రయత్నించండి.')
  }
}
