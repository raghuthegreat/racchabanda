// node --test: keeping what someone typed across the login round trip (lib/drafts.js), with a
// fake sessionStorage
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { saveDraft, takeDraft, replyDraftKey, NEW_THREAD_DRAFT_KEY } from '../lib/drafts.js'

function fakeStorage() {
  const m = new Map()
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }
}

test('keys: one per thread for replies, one for a new thread', () => {
  assert.equal(replyDraftKey(12), 'rb-draft:reply:12')
  assert.notEqual(replyDraftKey(12), replyDraftKey(13))
  assert.equal(NEW_THREAD_DRAFT_KEY, 'rb-draft:new')
})

test('save then take: the same fields come back once, then it is gone', () => {
  const st = fakeStorage()
  saveDraft('rb-draft:reply:12', { body: 'కడపలో కూడా' }, st)
  assert.deepEqual(takeDraft('rb-draft:reply:12', st), { body: 'కడపలో కూడా' })
  assert.equal(takeDraft('rb-draft:reply:12', st), null)
})

test('nothing typed is not saved', () => {
  const st = fakeStorage()
  saveDraft('rb-draft:new', { title: '  ', body: '' }, st)
  assert.equal(st.m.size, 0)
})

test('a broken or blocked storage never throws', () => {
  const broken = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') }, removeItem() { throw new Error('blocked') } }
  assert.doesNotThrow(() => saveDraft('k', { body: 'x' }, broken))
  assert.equal(takeDraft('k', broken), null)
  assert.equal(takeDraft('k', undefined), null)
  const st = fakeStorage(); st.setItem('k', '{not json')
  assert.equal(takeDraft('k', st), null)
})
