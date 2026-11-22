// The shared front of every write route (app/api/*): the request must come from one of the
// site's own pages (Origin), the person is whoever the site says (their own cookie, asked of
// /api/forum/me), then lib/write.js decides. Answers are JSON and never cached.

import { allowedOrigins, originAllowed } from './write.js'
import { getMe } from './site.js'
import { supabaseStore } from './store.js'
import { writeDb } from './db.js'

const json = (status, body) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

export async function handleWrite(request, run) {
  if (!originAllowed(request.headers.get('origin'), allowedOrigins())) {
    return json(403, { error: 'origin', message: 'ఈ పేజీ నుండి రాయలేరు' })
  }
  let input = {}
  if (request.method !== 'DELETE') {
    try { input = await request.json() } catch (e) { return json(400, { error: 'bad request', message: 'సరిగ్గా అందలేదు' }) }
  }
  const me = (await getMe(request.headers.get('cookie') || '')).user
  try {
    const { status, body } = await run(supabaseStore(writeDb()), me, input || {})
    return json(status, body)
  } catch (e) {
    console.error('forum write failed', e)
    return json(500, { error: 'server', message: 'సేవ్ కాలేదు. కొంచెం ఆగి మళ్ళీ ప్రయత్నించండి.' })
  }
}
