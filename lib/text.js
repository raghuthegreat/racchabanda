// Text rules shared by pages and saving: thread links, title/body limits (the same as
// supabase/migrations/001_forum_v2.sql), and "time ago" in Telugu like the site's 🔔 page.

export const TITLE_MAX = 200
export const BODY_MAX = 5000
const SLUG_MAX = 60

// "బొక్క అంటే తిట్టు!" -> "బొక్క-అంటే-తిట్టు": letters (with their vowel signs and virama)
// and digits stay, everything else becomes one "-"
export function slugify(title) {
  const slug = String(title || '').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '')
  if (slug.length <= SLUG_MAX) return slug
  const cut = slug.slice(0, SLUG_MAX)
  const lastDash = cut.lastIndexOf('-')
  return (lastDash > 0 ? cut.slice(0, lastDash) : cut).replace(/-+$/, '')
}

// Inside the app (basePath /racchabanda is added by Next.js links). The slug is percent-encoded:
// the path goes into Location headers (redirects), emails and canonical links, which take
// only ASCII; browsers still show it in Telugu.
export function threadPath(thread) {
  const slug = slugify(thread.title)
  return slug ? `/t/${thread.id}/${encodeURIComponent(slug)}` : `/t/${thread.id}`
}

export function cleanTitle(value) {
  const title = String(value ?? '').replace(/\s+/g, ' ').trim()
  if (!title) return { ok: false, error: 'శీర్షిక రాయండి' }
  if (title.length > TITLE_MAX) return { ok: false, error: `శీర్షిక ${TITLE_MAX} అక్షరాల లోపు ఉండాలి` }
  return { ok: true, value: title }
}

export function cleanBody(value, { allowEmpty = false } = {}) {
  const body = String(value ?? '').replace(/\r\n?/g, '\n').trim()
  if (!body && !allowEmpty) return { ok: false, error: 'ఏదైనా రాయండి' }
  if (body.length > BODY_MAX) return { ok: false, error: `${BODY_MAX} అక్షరాల లోపు రాయండి` }
  return { ok: true, value: body }
}

// A post's text split into plain parts and http(s) links, for React to render (it escapes the
// text, so nothing typed becomes HTML). A link stops at whitespace; trailing punctuation
// (".", ",", ")" ...) stays text.
const URL_RE = /https?:\/\/[^\s<>"]+/g
export function linkParts(text) {
  const s = String(text || '')
  const parts = []
  let at = 0
  for (const m of s.matchAll(URL_RE)) {
    const href = m[0].replace(/[.,;:!?)\]}'"]+$/u, '')
    if (m.index > at) parts.push({ text: s.slice(at, m.index) })
    parts.push({ href, text: href })
    at = m.index + href.length
  }
  if (at < s.length) parts.push({ text: s.slice(at) })
  return parts
}

export function timeAgo(when, now = new Date()) {
  const then = new Date(when)
  const secs = (now - then) / 1000
  if (secs < 60) return 'ఇప్పుడే'
  if (secs < 3600) return `${Math.floor(secs / 60)} నిమిషాల క్రితం`
  if (secs < 86400) return `${Math.floor(secs / 3600)} గంటల క్రితం`
  if (secs < 2 * 86400) return 'నిన్న'
  if (secs < 30 * 86400) return `${Math.floor(secs / 86400)} రోజుల క్రితం`
  return then.toISOString().slice(0, 10)
}
