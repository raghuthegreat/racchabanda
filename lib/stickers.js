// The Telugu word stickers used as reactions. The database keeps only the code
// (reactions.sticker); labels and colours live here, so a later illustrated set (బతుకమ్మ,
// బోనం, గాలిపటం...) is new entries in this list, with no database change. Original words and
// art only: no film stills or famous faces.

export const STICKERS = [
  { code: 'keka', label: 'కేక', tone: 'thatch' },
  { code: 'super', label: 'సూపర్', tone: 'leaf' },
  { code: 'hahha', label: 'హహ్హా', tone: 'cream' },
  { code: 'ayyo', label: 'అయ్యో', tone: 'mud' },
  { code: 'auna', label: 'ఔనా?', tone: 'leaf' },
  { code: 'baboy', label: 'బాబోయ్', tone: 'mud' },
  { code: 'dandam', label: 'దండం', tone: 'mud' },
  { code: 'adirindi', label: 'అదిరింది', tone: 'thatch' },
]

const BY_CODE = new Map(STICKERS.map((s) => [s.code, s]))

export function isSticker(code) {
  return typeof code === 'string' && BY_CODE.has(code)
}

export function sticker(code) {
  return BY_CODE.get(code) || null
}

// Reaction rows ({sticker, user_id}) of one post -> [{code, label, tone, n, mine}] in the
// stickers' order; codes no longer in the list are left out
export function countStickers(rows, meId) {
  const counts = new Map()
  for (const r of rows) {
    if (!BY_CODE.has(r.sticker)) continue
    const c = counts.get(r.sticker) || { n: 0, mine: false }
    c.n += 1
    if (meId && r.user_id === meId) c.mine = true
    counts.set(r.sticker, c)
  }
  return STICKERS.filter((s) => counts.has(s.code)).map((s) => ({ ...s, ...counts.get(s.code) }))
}
