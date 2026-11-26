// Photo rules shared by the browser (resizing) and the server (checking what is saved).
// A photo is {full, thumb, w, h}: the resized photo (FULL_PX on its longest side) and its
// thumbnail (THUMB_PX), uploaded by the browser straight to the site's S3 bucket under forum/
// with a signature from the site (yaasa backend/forum.py), and the full photo's size.
//
// Env: PHOTOS_BASE_URL, this environment's bucket + forum/, e.g.
//   https://yaasalu-staging.s3.amazonaws.com/forum/ (staging), https://yaasalu.s3.amazonaws.com/forum/ (prod)
// Unset: photos are off (the 📷 button hides, posts with photos are refused).

export const FULL_PX = 2048
export const THUMB_PX = 480
export const PHOTOS_MAX = 4
export const PHOTO_QUALITY = 0.85
const MAX_SIDE = 4096

export function photoBase(env = process.env) {
  const base = String(env.PHOTOS_BASE_URL || '').trim()
  if (!base) return null
  return base.endsWith('/') ? base : `${base}/`
}

// Longest side down to `max`, never enlarged, whole pixels (at least 1)
export function fitSize(w, h, max) {
  const scale = Math.min(1, max / Math.max(w, h))
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) }
}

// The site names uploads forum/<YYYY-MM>/<16 hex>.<jpg|webp>, the thumbnail the same + "-t"
const FULL_PATH = /^\d{4}-\d{2}\/[0-9a-f]{16}\.(jpg|webp)$/

export function cleanPhotos(list, base) {
  if (list === undefined || list === null) return { ok: true, value: [] }
  if (!Array.isArray(list)) return { ok: false, error: 'ఫోటోలు సరిగ్గా లేవు' }
  if (!list.length) return { ok: true, value: [] }
  if (!base) return { ok: false, error: 'ఫోటోలు ఇప్పుడు తీసుకోలేం' }
  if (list.length > PHOTOS_MAX) return { ok: false, error: `${PHOTOS_MAX} ఫోటోల వరకే` }
  const out = []
  const seen = new Set()
  for (const p of list) {
    if (!p || typeof p !== 'object') return { ok: false, error: 'ఫోటోలు సరిగ్గా లేవు' }
    const { full, thumb, w, h } = p
    if (typeof full !== 'string' || typeof thumb !== 'string' || !full.startsWith(base) || !thumb.startsWith(base)) {
      return { ok: false, error: 'ఈ ఫోటో మా దగ్గర లేదు' }
    }
    const path = full.slice(base.length)
    const m = path.match(FULL_PATH)
    if (!m || thumb !== base + path.replace(/\.(jpg|webp)$/, `-t.${m[1]}`)) return { ok: false, error: 'ఈ ఫోటో మా దగ్గర లేదు' }
    if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w > MAX_SIDE || h > MAX_SIDE) {
      return { ok: false, error: 'ఫోటోలు సరిగ్గా లేవు' }
    }
    if (seen.has(full)) return { ok: false, error: 'ఒకే ఫోటో రెండుసార్లు' }
    seen.add(full)
    out.push({ full, thumb, w, h })
  }
  return { ok: true, value: out }
}

export const photoUrls = (photos) => (photos || []).flatMap((p) => [p.full, p.thumb])
