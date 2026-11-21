// node --test: the Telugu word stickers (lib/stickers.js)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { STICKERS, sticker, isSticker, countStickers } from '../lib/stickers.js'

test('the eight agreed stickers, in order', () => {
  assert.deepEqual(STICKERS.map((s) => s.code), ['keka', 'super', 'hahha', 'ayyo', 'auna', 'baboy', 'dandam', 'adirindi'])
  assert.deepEqual(STICKERS.map((s) => s.label), ['కేక', 'సూపర్', 'హహ్హా', 'అయ్యో', 'ఔనా?', 'బాబోయ్', 'దండం', 'అదిరింది'])
})

test('codes fit the database rule ^[a-z0-9_]{1,30}$ and are unique', () => {
  for (const s of STICKERS) assert.match(s.code, /^[a-z0-9_]{1,30}$/)
  assert.equal(new Set(STICKERS.map((s) => s.code)).size, STICKERS.length)
})

test('every sticker has a tone for its colours', () => {
  for (const s of STICKERS) assert.ok(['thatch', 'leaf', 'mud', 'cream'].includes(s.tone), s.code)
})

test('isSticker / sticker look codes up; unknown ones are refused', () => {
  assert.equal(isSticker('keka'), true)
  assert.equal(isSticker('KEKA'), false)
  assert.equal(isSticker('nope'), false)
  assert.equal(isSticker(undefined), false)
  assert.equal(sticker('dandam').label, 'దండం')
  assert.equal(sticker('nope'), null)
})

test('countStickers: per sticker, in the agreed order, with "mine" marked; unknown codes dropped', () => {
  const rows = [
    { sticker: 'dandam', user_id: 'u1' }, { sticker: 'keka', user_id: 'u2' },
    { sticker: 'keka', user_id: 'u1' }, { sticker: 'old_code', user_id: 'u3' },
  ]
  assert.deepEqual(countStickers(rows, 'u1'), [
    { code: 'keka', label: 'కేక', tone: 'thatch', n: 2, mine: true },
    { code: 'dandam', label: 'దండం', tone: 'mud', n: 1, mine: true },
  ])
  assert.deepEqual(countStickers(rows, null).map((s) => s.mine), [false, false])
  assert.deepEqual(countStickers([], 'u1'), [])
})
