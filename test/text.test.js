// node --test: thread links, the title/body rules and Telugu "time ago" (lib/text.js)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { slugify, threadPath, cleanTitle, cleanBody, timeAgo, TITLE_MAX, BODY_MAX } from '../lib/text.js'

test('slugify writes Telugu in English letters (lib/roman.js) and joins the words with -', () => {
  assert.equal(slugify('"బొక్క" అంటే మా ఊర్లో రంధ్రం కాదు, తిట్టు!'), 'bokka-ante-ma-urlo-randhram-kadu')
  assert.equal(slugify('దీవి ఏసింది అంటారా మీ ఊర్లో'), 'divi-esindi-antara-mi-urlo')
  assert.equal(slugify('Auna vs Avuna?'), 'auna-vs-avuna')
  assert.equal(slugify('  --!!--  '), '')
  assert.equal(slugify('😀😀'), '', 'nothing spellable: the address is just /t/<id>')
})

test('slugify spells a conjunct as one sound', () => {
  assert.equal(slugify('క్రిందికి'), 'krindiki')
})

test('slugify keeps at most 6 words and about 60 characters, ending on a whole word', () => {
  assert.equal(slugify('ఒకటి రెండు మూడు నాలుగు ఐదు ఆరు ఏడు ఎనిమిది'), 'okati-rendu-mudu-nalugu-aidu-aru')
  const s = slugify('పదం '.repeat(40))
  assert.ok(s.length <= 60, s.length)
  assert.ok(!s.endsWith('-'))
  assert.ok(s.split('-').every((w) => w === 'padam'))
  const long = slugify('a'.repeat(80) + ' b')
  assert.ok(long.length <= 60 && long.length > 0, long)
})

test('threadPath: /t/<id>/<slug>, plain ASCII (it goes into Location headers and emails)', () => {
  assert.equal(threadPath({ id: 12, title: 'బొక్క అంటే?' }), '/t/12/bokka-ante')
  assert.match(threadPath({ id: 12, title: 'దీవి ఏసింది అంటారా మీ ఊర్లో' }), /^[\x21-\x7e]+$/)
  assert.equal(threadPath({ id: 7, title: '???' }), '/t/7')
})

test('cleanTitle trims, joins whitespace, refuses empty and too long', () => {
  assert.deepEqual(cleanTitle('  ఒక   చర్చ \n'), { ok: true, value: 'ఒక చర్చ' })
  assert.equal(cleanTitle('   ').ok, false)
  assert.equal(cleanTitle(null).ok, false)
  assert.equal(cleanTitle('అ'.repeat(TITLE_MAX)).ok, true)
  assert.equal(cleanTitle('అ'.repeat(TITLE_MAX + 1)).ok, false)
})

test('cleanBody keeps line breaks, trims the ends, refuses empty (unless allowed) and too long', () => {
  assert.deepEqual(cleanBody('  మొదటి లైను\n\nరెండో లైను  '), { ok: true, value: 'మొదటి లైను\n\nరెండో లైను' })
  assert.equal(cleanBody('   ').ok, false)
  assert.deepEqual(cleanBody('', { allowEmpty: true }), { ok: true, value: '' })
  assert.equal(cleanBody('a'.repeat(BODY_MAX)).ok, true)
  assert.equal(cleanBody('a'.repeat(BODY_MAX + 1)).ok, false)
})

test('limits match the database (001_forum_v2.sql)', () => {
  assert.equal(TITLE_MAX, 200)
  assert.equal(BODY_MAX, 5000)
})

test('timeAgo in Telugu, like the site\'s 🔔 page', () => {
  const now = new Date('2026-11-21T12:00:00Z')
  const ago = (secs) => timeAgo(new Date(now - secs * 1000).toISOString(), now)
  assert.equal(ago(20), 'ఇప్పుడే')
  assert.equal(ago(20 * 60), '20 నిమిషాల క్రితం')
  assert.equal(ago(2 * 3600), '2 గంటల క్రితం')
  assert.equal(ago(30 * 3600), 'నిన్న')
  assert.equal(ago(5 * 86400), '5 రోజుల క్రితం')
  assert.equal(ago(40 * 86400), '2026-10-12')
})

test('linkParts: web addresses become links, everything else stays text (never HTML)', async () => {
  const { linkParts } = await import('../lib/text.js')
  assert.deepEqual(linkParts('చూడండి https://www.yaasalu.com/yaasa/బొక్క, బాగుంది'), [
    { text: 'చూడండి ' }, { href: 'https://www.yaasalu.com/yaasa/బొక్క', text: 'https://www.yaasalu.com/yaasa/బొక్క' }, { text: ', బాగుంది' }])
  assert.deepEqual(linkParts('a <b>bold</b> javascript:alert(1)'), [{ text: 'a <b>bold</b> javascript:alert(1)' }])
  assert.deepEqual(linkParts('(http://x.test/a).'), [{ text: '(' }, { href: 'http://x.test/a', text: 'http://x.test/a' }, { text: ').' }])
  assert.deepEqual(linkParts(''), [])
})
