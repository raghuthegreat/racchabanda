// Telugu in everyday English letters, for thread addresses (/t/12/bokka-ante). A port of the
// site's main spelling (yaasa backend/roman.py _spell, with short vowels and no alternates), so
// the forum and the dictionary spell words alike: ఉయ్యాల -> uyyala, పంగ -> panga, శనివారం ->
// shanivaram. Rules only. English letters and digits stay; anything else is dropped.

// Independent vowels and vowel signs: the short spelling (people rarely type "aa", "ee")
const VOWELS = {
  'అ': 'a', 'ఆ': 'a', 'ఇ': 'i', 'ఈ': 'i', 'ఉ': 'u', 'ఊ': 'u', 'ఋ': 'ru', 'ౠ': 'ru',
  'ఎ': 'e', 'ఏ': 'e', 'ఐ': 'ai', 'ఒ': 'o', 'ఓ': 'o', 'ఔ': 'au',
}
const SIGNS = {
  'ా': 'a', 'ి': 'i', 'ీ': 'i', 'ు': 'u', 'ూ': 'u', 'ృ': 'ru', 'ౄ': 'ru', 'ె': 'e',
  'ే': 'e', 'ై': 'ai', 'ొ': 'o', 'ో': 'o', 'ౌ': 'au',
}
const CONSONANTS = {
  'క': 'k', 'ఖ': 'kh', 'గ': 'g', 'ఘ': 'gh', 'ఙ': 'n', 'చ': 'ch', 'ఛ': 'chh', 'జ': 'j', 'ఝ': 'jh', 'ఞ': 'n',
  'ట': 't', 'ఠ': 'th', 'డ': 'd', 'ఢ': 'dh', 'ణ': 'n', 'త': 't', 'థ': 'th', 'ద': 'd', 'ధ': 'dh', 'న': 'n',
  'ప': 'p', 'ఫ': 'ph', 'బ': 'b', 'భ': 'bh', 'మ': 'm', 'య': 'y', 'ర': 'r', 'ఱ': 'r', 'ల': 'l', 'వ': 'v',
  'శ': 'sh', 'ష': 'sh', 'స': 's', 'హ': 'h', 'ళ': 'l', 'ౘ': 'ts', 'ౙ': 'dz',
}
const VIRAMA = '్'
const ANUSVARA = 'ం'
const VISARGA = 'ః'
const CHANDRABINDU = 'ఁ'
const LIP_SOUNDS = ['p', 'b', 'm']   // ం before these sounds like m, otherwise n

function kindOf(ch) {
  if (ch in CONSONANTS) return 'C'
  if (ch in VOWELS) return 'V'
  if (ch in SIGNS) return 'S'
  if (ch === VIRAMA) return 'X'
  if (ch === ANUSVARA || ch === VISARGA || ch === CHANDRABINDU) return 'M'
  return 'O'
}

export function toRoman(text) {
  const chars = [...String(text ?? '')]
  const kinds = chars.map(kindOf)
  let out = ''
  chars.forEach((ch, i) => {
    const kind = kinds[i]
    const next = chars[i + 1]
    if (kind === 'C') {
      out += CONSONANTS[ch]
      // A consonant carries an "a" unless a vowel sign or virama follows
      if (kinds[i + 1] !== 'S' && kinds[i + 1] !== 'X') out += 'a'
    } else if (kind === 'S') {
      out += SIGNS[ch]
    } else if (kind === 'V') {
      out += VOWELS[ch]
    } else if (kind === 'M') {
      if (ch === ANUSVARA) {
        const following = CONSONANTS[next] || ''
        out += !following || LIP_SOUNDS.some((s) => following.startsWith(s)) ? 'm' : 'n'
      } else if (ch === VISARGA) {
        out += 'h'
      }
    } else if (kind === 'O') {
      out += ch.toLowerCase()
    }
  })
  return out.replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, ' ').trim()
}
