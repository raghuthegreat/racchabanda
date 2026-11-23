// node --test: talking to the yaasalu site (lib/site.js) with a fake fetch
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getMe, notifyReply, siteUrl, deletePhotos } from '../lib/site.js'

const LOGGED_OUT = { user: null, unseen: 0 }

function fakeFetch(reply) {
  const calls = []
  const fn = async (url, opts) => {
    calls.push({ url, opts })
    if (reply instanceof Error) throw reply
    return { ok: reply.status === 200, status: reply.status, json: async () => reply.body }
  }
  fn.calls = calls
  return fn
}

test('siteUrl: SITE_API_URL, else the live site, never a trailing slash', () => {
  assert.equal(siteUrl({}), 'https://www.yaasalu.com')
  assert.equal(siteUrl({ SITE_API_URL: 'https://yaasa.herokuapp.com/' }), 'https://yaasa.herokuapp.com')
})

test('getMe forwards the visitor\'s cookie to /api/forum/me and returns the user', async () => {
  const me = { user: { id: 'u1', name: 'సీత', pic: '', admin: false }, unseen: 2 }
  const fetch = fakeFetch({ status: 200, body: me })
  assert.deepEqual(await getMe('session=abc', { fetch, env: { SITE_API_URL: 'https://s.test' } }), me)
  assert.equal(fetch.calls[0].url, 'https://s.test/api/forum/me')
  assert.equal(fetch.calls[0].opts.headers.cookie, 'session=abc')
  assert.equal(fetch.calls[0].opts.cache, 'no-store')
  assert.ok(fetch.calls[0].opts.signal, 'has a timeout')
})

test('getMe without a cookie does not call the site', async () => {
  const fetch = fakeFetch({ status: 200, body: {} })
  assert.deepEqual(await getMe('', { fetch, env: {} }), LOGGED_OUT)
  assert.equal(fetch.calls.length, 0)
})

test('getMe: site down, an error status or odd JSON -> logged out (the page still renders)', async () => {
  assert.deepEqual(await getMe('s=1', { fetch: fakeFetch(new Error('down')), env: {} }), LOGGED_OUT)
  assert.deepEqual(await getMe('s=1', { fetch: fakeFetch({ status: 500, body: {} }), env: {} }), LOGGED_OUT)
  assert.deepEqual(await getMe('s=1', { fetch: fakeFetch({ status: 200, body: { user: 'x' } }), env: {} }), LOGGED_OUT)
})

test('notifyReply posts to /api/forum/notify with the token, the thread path under /racchabanda', async () => {
  const fetch = fakeFetch({ status: 200, body: { ok: true } })
  const ok = await notifyReply({ to: ['u1', 'u2'], actor: 'u3', thread: { id: 12, title: 'బొక్క అంటే?' }, body: 'కడపలో కూడా' },
                               { fetch, env: { SITE_API_URL: 'https://s.test', FORUM_TOKEN: 'tok' } })
  assert.equal(ok, true)
  const { url, opts } = fetch.calls[0]
  assert.equal(url, 'https://s.test/api/forum/notify')
  assert.equal(opts.method, 'POST')
  assert.equal(opts.headers['X-Forum-Token'], 'tok')
  assert.deepEqual(JSON.parse(opts.body), {
    to: ['u1', 'u2'], kind: 'forum_reply', actor: 'u3', body: 'కడపలో కూడా',
    thread: { id: 12, title: 'బొక్క అంటే?', url: '/racchabanda/t/12/' + encodeURIComponent('బొక్క-అంటే') },
  })
})

test('notifyReply: nobody to tell, no token, or the site failing -> false, never throws', async () => {
  const env = { FORUM_TOKEN: 'tok' }
  const thread = { id: 1, title: 't' }
  assert.equal(await notifyReply({ to: [], actor: 'u', thread }, { fetch: fakeFetch({ status: 200, body: {} }), env }), false)
  assert.equal(await notifyReply({ to: ['a'], actor: 'u', thread }, { fetch: fakeFetch({ status: 200, body: {} }), env: {} }), false)
  assert.equal(await notifyReply({ to: ['a'], actor: 'u', thread }, { fetch: fakeFetch(new Error('down')), env }), false)
  assert.equal(await notifyReply({ to: ['a'], actor: 'u', thread }, { fetch: fakeFetch({ status: 404, body: {} }), env }), false)
})

test('deletePhotos posts the addresses to /api/forum/photos/delete with the token; never throws', async () => {
  const fetch = fakeFetch({ status: 200, body: { deleted: 2 } })
  assert.equal(await deletePhotos(['a', 'b'], { fetch, env: { SITE_API_URL: 'https://s.test', FORUM_TOKEN: 'tok' } }), true)
  assert.equal(fetch.calls[0].url, 'https://s.test/api/forum/photos/delete')
  assert.equal(fetch.calls[0].opts.headers['X-Forum-Token'], 'tok')
  assert.deepEqual(JSON.parse(fetch.calls[0].opts.body), { urls: ['a', 'b'] })
  assert.equal(await deletePhotos([], { fetch, env: { FORUM_TOKEN: 'tok' } }), false)
  assert.equal(await deletePhotos(['a'], { fetch: fakeFetch(new Error('down')), env: { FORUM_TOKEN: 'tok' } }), false)
})
