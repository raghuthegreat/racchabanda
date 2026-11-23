// What someone typed before logging in, kept in this tab's sessionStorage while they go to
// Google and back (the site's login returns them to the same page), then put back once.
// Never throws: a private window or blocked storage just means nothing is kept.

export const NEW_THREAD_DRAFT_KEY = 'rb-draft:new'
export const replyDraftKey = (threadId) => `rb-draft:reply:${threadId}`

const store = (s) => (s !== undefined ? s : (typeof window !== 'undefined' ? window.sessionStorage : null))

export function saveDraft(key, fields, storage) {
  const hasText = Object.values(fields || {}).some((v) => String(v ?? '').trim())
  if (!hasText) return
  try { store(storage).setItem(key, JSON.stringify(fields)) } catch (e) { /* nothing kept */ }
}

export function takeDraft(key, storage) {
  try {
    const s = store(storage)
    const raw = s.getItem(key)
    if (raw === null) return null
    s.removeItem(key)
    const fields = JSON.parse(raw)
    return fields && typeof fields === 'object' ? fields : null
  } catch (e) {
    return null
  }
}
