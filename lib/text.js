// Text rules shared by pages and saving: thread links, title/body limits (the same as
// supabase/migrations/001_forum_v2.sql), and "time ago" in Telugu like the site's 🔔 page.
import { toRoman } from './roman.js'

export const TITLE_MAX = 200
export const BODY_MAX = 5000
const SLUG_MAX = 60
const SLUG_WORDS = 6

// "బేగా అంటే ఏమిటి?" -> "bega-ante-emiti": the title in everyday English letters (lib/roman.js,
// the same spellings as the site), at most SLUG_WORDS words and about SLUG_MAX characters,
// joined with "-". Plain ASCII, so links read well when copied into WhatsApp or an email.
// Nothing spellable (only emoji or symbols): "" and the address is just /t/<id>.
export function slugify(title) {
  const words = toRoman(title).split(/[^a-z0-9]+/).filter(Boolean).slice(0, SLUG_WORDS)
  let slug = ''
  for (const w of words) {
    const next = slug ? `${slug}-${w}` : w
    if (next.length > SLUG_MAX) return slug || w.slice(0, SLUG_MAX)
    slug = next
  }
  return slug
}

// Inside the app (basePath /racchabanda is added by Next.js links). Any other slug for the same
// thread (an older Telugu one, a mistyped one) redirects here (app/t/[id]/[[...slug]]/page.js).
export function threadPath(thread) {
  const slug = slugify(thread.title)
  return slug ? `/t/${thread.id}/${slug}` : `/t/${thread.id}`
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
