// Replies shown in the conversation while they are being sent, so a reply appears the moment
// you tap send. Each is {key, body, photos, id}: id is null until the server has saved it.
// Once the refreshed page shows the real bubble (its id is among the page's posts), the pending
// one is hidden, in the same render, so there is never a duplicate.
// Pure functions over a list (React state): each returns a new list.

export function addPending(list, { key, body = '', photos = [] }) {
  return [...list, { key, body, photos, id: null }]
}

export function markSent(list, key, id) {
  return list.some((p) => p.key === key) ? list.map((p) => (p.key === key ? { ...p, id } : p)) : list
}

export function dropPending(list, key) {
  return list.filter((p) => p.key !== key)
}

export function visiblePending(list, knownIds) {
  const known = new Set(knownIds)
  return list.filter((p) => p.id === null || !known.has(p.id))
}
