// The chat view's logic, kept out of the components so it can be tested: messages grouped by
// speaker with day separators, and times in India time (the server runs on UTC; most readers
// are in India, and a day separator must change at Indian midnight, not UTC's).

const IST_MS = 5.5 * 3600 * 1000
const GROUP_GAP_MS = 30 * 60 * 1000
const MONTHS = ['జనవరి', 'ఫిబ్రవరి', 'మార్చి', 'ఏప్రిల్', 'మే', 'జూన్', 'జులై', 'ఆగస్టు', 'సెప్టెంబర్', 'అక్టోబర్', 'నవంబర్', 'డిసెంబర్']
const MONTHS_SHORT = ['జన', 'ఫిబ్ర', 'మార్చి', 'ఏప్రి', 'మే', 'జూన్', 'జులై', 'ఆగ', 'సెప్టెం', 'అక్టో', 'నవం', 'డిసెం']
const WEEKDAYS = ['ఆదివారం', 'సోమవారం', 'మంగళవారం', 'బుధవారం', 'గురువారం', 'శుక్రవారం', 'శనివారం']

// The wall clock in India: a Date whose UTC fields read as IST
const inIst = (when) => new Date(new Date(when).getTime() + IST_MS)
const dayNumber = (when) => Math.floor(inIst(when).getTime() / 86400000)

export function clockTime(when) {
  const d = inIst(when)
  const h = d.getUTCHours()
  const m = String(d.getUTCMinutes()).padStart(2, '0')
  return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`
}

export function dayLabel(when, now = new Date()) {
  const diff = dayNumber(now) - dayNumber(when)
  if (diff === 0) return 'ఈ రోజు'
  if (diff === 1) return 'నిన్న'
  const d = inIst(when)
  const year = d.getUTCFullYear() !== inIst(now).getUTCFullYear() ? ` ${d.getUTCFullYear()}` : ''
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}${year}`
}

// The chat list's time: today's clock, నిన్న, a weekday within the week, else a short date
export function listTime(when, now = new Date()) {
  const diff = dayNumber(now) - dayNumber(when)
  if (diff <= 0) return clockTime(when)
  if (diff === 1) return 'నిన్న'
  const d = inIst(when)
  if (diff < 7) return WEEKDAYS[d.getUTCDay()]
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`
}

// Replies -> [{type: 'day', label} | {type: 'msg', post, mine, first, last, time}]. A group is a
// run from one person on one day with no gap over 30 minutes: its first message shows the name
// and avatar, its last the bubble's tail.
export function chatItems(posts, meId, now = new Date()) {
  const items = []
  let prev = null
  for (const post of posts) {
    const day = dayNumber(post.created_at)
    if (!prev || dayNumber(prev.created_at) !== day) items.push({ type: 'day', label: dayLabel(post.created_at, now) })
    const lastItem = items[items.length - 1]
    const joins = prev && lastItem.type === 'msg' && prev.author_id === post.author_id
      && new Date(post.created_at) - new Date(prev.created_at) <= GROUP_GAP_MS
    if (joins) lastItem.last = false
    items.push({ type: 'msg', post, mine: !!meId && post.author_id === meId, first: !joins, last: true, time: clockTime(post.created_at) })
    prev = post
  }
  return items
}

// The list's second line: "name: newest words", or the opening words before anyone replied
export function lastLine(thread) {
  if (thread.reply_count > 0) {
    if (!thread.last_author_name && !thread.last_snippet) return ''
    return `${thread.last_author_name}: ${thread.last_snippet}`
  }
  const opening = String(thread.body || '').replace(/\s+/g, ' ').trim().slice(0, 120)
  return opening ? `${thread.author_name}: ${opening}` : `${thread.author_name} చర్చ మొదలుపెట్టారు`
}
