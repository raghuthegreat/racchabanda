// node --test: replies shown in the conversation while they are being sent (lib/pending.js).
// Each function returns a new list (React state), never changes the one it was given.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addPending, markSent, dropPending, visiblePending } from '../lib/pending.js'

const A = { key: 'a', body: 'కడపలో కూడా', photos: [] }
const B = { key: 'b', body: '', photos: [{ full: 'f', thumb: 't', w: 2, h: 1 }] }

test('addPending: the new reply goes last, with no id yet; the old list is untouched', () => {
  const one = addPending([], A)
  const two = addPending(one, B)
  assert.deepEqual(two.map((p) => p.key), ['a', 'b'])
  assert.equal(two[1].id, null)
  assert.equal(one.length, 1)
})

test('markSent: gives that reply its real id; the others stay as they are', () => {
  const list = markSent(addPending(addPending([], A), B), 'a', 41)
  assert.equal(list[0].id, 41)
  assert.equal(list[1].id, null)
  assert.deepEqual(markSent(list, 'zz', 9), list, 'an unknown key changes nothing')
})

test('visiblePending: hidden once the page shows its real bubble; unsent ones stay', () => {
  const list = markSent(addPending(addPending([], A), B), 'a', 41)
  assert.deepEqual(visiblePending(list, [40, 41]).map((p) => p.key), ['b'])
  assert.deepEqual(visiblePending(list, [40]).map((p) => p.key), ['a', 'b'], 'sent but not on the page yet: still shown')
  assert.deepEqual(visiblePending(list, []).map((p) => p.key), ['a', 'b'])
})

test('dropPending: removes that one reply (a failed send)', () => {
  const list = addPending(addPending([], A), B)
  assert.deepEqual(dropPending(list, 'a').map((p) => p.key), ['b'])
  assert.deepEqual(dropPending(list, 'zz').map((p) => p.key), ['a', 'b'])
})
