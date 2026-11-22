// Talking to the yaasalu site (Flask, yaasa backend/forum.py), server side only. The site is
// the home of users and notifications: it says who is logged in (from the visitor's own session
// cookie, which reaches the forum because both live on www.yaasalu.com behind nginx) and sends
// the 🔔 entries and emails for replies.
//
// Env: SITE_API_URL (default https://www.yaasalu.com; staging: https://yaasa.herokuapp.com),
// FORUM_TOKEN (the same value as the site's FORUM_TOKEN config var).

import { threadPath } from './text.js'

const LOGGED_OUT = Object.freeze({ user: null, unseen: 0 })
const TIMEOUT_MS = 3000

export function siteUrl(env = process.env) {
  return (env.SITE_API_URL || 'https://www.yaasalu.com').replace(/\/+$/, '')
}

// {user: {id, name, pic, admin}, unseen} or {user: null, unseen: 0}. Never throws: if the site
// can't say, the visitor is treated as logged out and the page still renders.
export async function getMe(cookie, { fetch = globalThis.fetch, env = process.env } = {}) {
  if (!cookie) return { ...LOGGED_OUT }
  try {
    const r = await fetch(`${siteUrl(env)}/api/forum/me`, {
      headers: { cookie, accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (r.status !== 200) return { ...LOGGED_OUT }
    const body = await r.json()
    const user = body && body.user
    if (!user || typeof user !== 'object' || !user.id) return { ...LOGGED_OUT }
    return { user, unseen: Number(body.unseen) || 0 }
  } catch (e) {
    return { ...LOGGED_OUT }
  }
}

// A reply in a thread: 🔔 + activity email for `to` (the site skips the actor). true when the
// site took it. Never throws: a reply is saved whether or not anyone hears about it.
export async function notifyReply({ to, actor, thread, body }, { fetch = globalThis.fetch, env = process.env } = {}) {
  if (!to || !to.length || !env.FORUM_TOKEN) return false
  try {
    const r = await fetch(`${siteUrl(env)}/api/forum/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forum-Token': env.FORUM_TOKEN },
      body: JSON.stringify({
        to, kind: 'forum_reply', actor, body,
        thread: { id: thread.id, title: thread.title, url: `/racchabanda${threadPath(thread)}` },
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    return r.status === 200
  } catch (e) {
    return false
  }
}
