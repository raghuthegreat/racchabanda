// node --test: photo rules (lib/photos.js)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanPhotos, fitSize, photoBase, PHOTOS_MAX, FULL_PX, THUMB_PX } from '../lib/photos.js'

const BASE = 'https://yaasalu-staging.s3.amazonaws.com/forum/'
const P = (n, extra = {}) => ({ full: `${BASE}2026-11/${'a'.repeat(15)}${n}.jpg`, thumb: `${BASE}2026-11/${'a'.repeat(15)}${n}-t.jpg`, w: 2048, h: 1536, ...extra })

test('sizes: full 2048px, thumbnail 480px, at most 4 photos', () => {
  assert.deepEqual([FULL_PX, THUMB_PX, PHOTOS_MAX], [2048, 480, 4])
})

test('photoBase: from PHOTOS_BASE_URL, with a trailing slash; none -> null (photos off)', () => {
  assert.equal(photoBase({ PHOTOS_BASE_URL: 'https://yaasalu-staging.s3.amazonaws.com/forum' }), BASE)
  assert.equal(photoBase({}), null)
})

test('fitSize: longest side to the limit, never enlarged, whole pixels', () => {
  assert.deepEqual(fitSize(4000, 3000, 2048), { w: 2048, h: 1536 })
  assert.deepEqual(fitSize(3000, 4000, 2048), { w: 1536, h: 2048 })
  assert.deepEqual(fitSize(800, 600, 2048), { w: 800, h: 600 })
  assert.deepEqual(fitSize(4032, 3024, 480), { w: 480, h: 360 })
  assert.deepEqual(fitSize(1001, 3, 480), { w: 480, h: 1 })
})

test('cleanPhotos: our own forum/ uploads in this bucket pass, cleaned to {full, thumb, w, h}', () => {
  assert.deepEqual(cleanPhotos([P(1, { extra: 'dropped' })], BASE), { ok: true, value: [P(1)] })
  assert.deepEqual(cleanPhotos(undefined, BASE), { ok: true, value: [] })
  assert.deepEqual(cleanPhotos([], null), { ok: true, value: [] })
})

test('cleanPhotos: refused when it is not ours or not sane', () => {
  const bad = [
    [P(1), P(2), P(3), P(4), P(5)],                                                     // more than 4
    [P(1, { full: 'https://evil.example/forum/2026-11/x.jpg' })],                          // elsewhere
    [P(1, { full: 'https://yaasalu.s3.amazonaws.com/forum/2026-11/x.jpg' })],              // another bucket
    [P(1, { full: BASE.replace('forum/', 'images/') + 'yaasalu-image-1-x.jpg' })],         // a word photo
    [P(1, { thumb: `${BASE}2026-11/other-t.jpg` })],                                       // thumb of another photo
    [P(1, { full: `${BASE}2026-11/../x.jpg` })],
    [P(1, { w: 0 })], [P(1, { h: 5000 })], [P(1, { w: '2048' })],
    'not a list', [null], [P(1)].concat([P(1)]),                                           // the same photo twice
  ]
  for (const b of bad) assert.equal(cleanPhotos(b, BASE).ok, false, JSON.stringify(b).slice(0, 80))
  assert.equal(cleanPhotos([P(1)], null).ok, false, 'photos off -> refused')
})
