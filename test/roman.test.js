// node --test: Telugu -> everyday English letters (lib/roman.js), for thread addresses.
// The expected spellings come from the site's own rules (yaasa backend/roman.py _spell, the
// main spelling: short vowels, ం as m or n by the next sound), so both read alike.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toRoman } from '../lib/roman.js'

const SAME_AS_THE_SITE = {
  'ఉయ్యాల': 'uyyala',
  'చెడుగుడు': 'chedugudu',
  'సరే': 'sare',
  'పంగ': 'panga',
  'గోపీచందనం': 'gopichandanam',
  'కబడ్డీ': 'kabaddi',
  'దీవి ఏసింది అంటారా మీ ఊర్లో': 'divi esindi antara mi urlo',
  '"బొక్క" అంటే మా ఊర్లో రంధ్రం కాదు, తిట్టు!': 'bokka ante ma urlo randhram kadu tittu',
  'క్రిందికి': 'krindiki',
  'శనివారం': 'shanivaram',
  'ఫోను': 'phonu',
  'దుఃఖం': 'duhkham',
  'తమ్ముడు': 'tammudu',
  'ఋషి': 'rushi',
  'Auna vs Avuna?': 'auna vs avuna',
  'వరంగల్ 2026 లో': 'varangal 2026 lo',
  'జాతర': 'jatara',
  'పలేమరికి అంటే ఏమిటి ?': 'palemariki ante emiti',
}

test('toRoman: the same spellings as the site (backend/roman.py)', () => {
  for (const [telugu, roman] of Object.entries(SAME_AS_THE_SITE)) assert.equal(toRoman(telugu), roman, telugu)
})

test('toRoman: empty or nothing spellable -> ""', () => {
  assert.equal(toRoman(''), '')
  assert.equal(toRoman(null), '')
  assert.equal(toRoman('?!...'), '')
})
