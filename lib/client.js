// Browser side: call the forum's write routes. Same-origin requests send the site's cookie and
// an Origin header by themselves. Returns {ok, status, data}; never throws.
export async function send(method, path, body) {
  try {
    const r = await fetch(`/racchabanda/api${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    })
    let data = {}
    try { data = await r.json() } catch (e) { /* empty answer */ }
    return { ok: r.ok, status: r.status, data }
  } catch (e) {
    return { ok: false, status: 0, data: { message: 'ఇంటర్నెట్ లేదు. మళ్ళీ ప్రయత్నించండి.' } }
  }
}

export const LOGIN_URL = '/login'
