// Supabase clients, server side only (never import this from a 'use client' file). The public
// address and key also go to the browser for live updates (livePublic below); the service-role
// key never does.
//   readDb:  the public anon key; the database lets it read and nothing else (row-level
//            security, 001_forum_v2.sql). Pages read with it.
//   writeDb: the service-role key, which bypasses row-level security. Only the route handlers
//            under app/api use it, after lib/write.js has checked who is writing.
//
// Env (Vercel: Preview -> yaasalu-staging, Production -> yaasalu-prod):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (secret: Vercel env only)

import { createClient } from '@supabase/supabase-js'

const OPTIONS = { auth: { persistSession: false, autoRefreshToken: false } }
let reader = null
let writer = null

export function readDb() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_ANON_KEY are not set')
  if (!reader) reader = createClient(url, key, OPTIONS)
  return reader
}

// For live updates in the browser (components/chat/Live.js): the project's address and the
// public read-only key, handed to the page as props. null when not configured (no live updates).
export function livePublic() {
  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  return url && anonKey ? { url, anonKey } : null
}

export function writeDb() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set')
  if (!writer) writer = createClient(url, key, OPTIONS)
  return writer
}
