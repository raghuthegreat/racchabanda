// Supabase clients, server side only. readDb uses the public anon key: the database lets it
// read and nothing else (row-level security, 001_forum_v2.sql). The writing client (service
// role) comes with saving, in step 4.
//
// Env (Vercel: Preview -> yaasalu-staging, Production -> yaasalu-prod):
//   SUPABASE_URL, SUPABASE_ANON_KEY

import { createClient } from '@supabase/supabase-js'

let reader = null

export function readDb() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_ANON_KEY are not set')
  if (!reader) reader = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return reader
}
