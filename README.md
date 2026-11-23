# రచ్చబండ (Racchabanda)

యాసలు's forum: ఊరంతా కూర్చుని మాట్లాడుకునే చోటు. One open stream of threads, each optionally
about a word (linked to its dictionary entry, and listed on that word's page) and a region.
Replies, Telugu word stickers, 🔔 and email when someone replies.

```
browser ─► Cloudflare ─► Heroku: yaasa (nginx) ─┬─► Flask: the site, /login, /api/forum/me, /api/forum/notify ─► Mongo
                                                └─► /racchabanda/* ─► Vercel: this app (Next.js 15) ─► Supabase (Postgres)
```

- **One login.** People sign in on the site (Google). The site's session cookie reaches this app
  because both live on the same domain behind nginx; the app's server asks the site who it is
  (`lib/site.js` getMe → `GET /api/forum/me`).
- **Data.** Forum content is in Supabase (`supabase/migrations/001_forum_v2.sql`): `threads`,
  `posts` (replies), `reactions` (stickers). People, words and notifications stay in the site's
  Mongo. The public anon key can only read; writes go through this app's server (`app/api/*`,
  rules in `lib/write.js`) with the service-role key.
- **Photos.** Up to 4 per thread or reply. The browser resizes each (2048px + a 480px
  thumbnail, re-encoded: no EXIF, so no GPS location) and uploads it straight to the site's S3
  bucket under `forum/`, with a signature from the site (`/api/forum/photo`, the visitor's own
  login). Deleting a post asks the site to delete its photos (`/api/forum/photos/delete`).
- **Look.** The site's own header, footer and stylesheets (`/Static/css/site.css`, `brand.css`),
  plus `app/forum.css`. The site's Telugu typing (`/Static/scripts/telugu-typing.js`) works on
  any text box with class `yc-text`.

## Run and test

Node.js 22 or later (`@supabase/supabase-js` needs Node 22's built-in WebSocket).

```
npm install
npm test            # node --test: lib/ rules and queries (no network)
npm run build && npm start
```

`.env.local` (git-ignored) for local runs: the settings below, `SITE_API_URL` pointing at a
local site (e.g. `http://localhost:5055`) and `FORUM_ORIGINS=http://localhost:3000`.

## Settings

| Name | Where | What |
|---|---|---|
| `SUPABASE_URL` | Vercel, site | The environment's Supabase project URL |
| `SUPABASE_ANON_KEY` | Vercel, site | Its public anon key (read-only) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel only (Sensitive) | Its service_role key; bypasses all security rules. Never in the browser, chat or git |
| `FORUM_TOKEN` | Vercel and site, same value | Lets this app ask the site for 🔔 entries and emails |
| `SITE_API_URL` | Vercel | The site's address: `https://yaasa.herokuapp.com` (staging), `https://www.yaasalu.com` (prod, the default) |
| `FORUM_ORIGINS` | Vercel, optional | Extra page addresses allowed to write (local tests). Not needed when the forum is served from the site's own domain |
| `FORUM_VERCEL_HOST` | site (Heroku) | The Vercel host nginx sends `/racchabanda` to |
| `FORUM_ENABLED` | site (Heroku) | `1` shows the రచ్చబండ menu link and the word pages' threads box |
| `PHOTOS_BASE_URL` | Vercel | Where forum photos live: `https://yaasalu-staging.s3.amazonaws.com/forum/` (staging), `https://yaasalu.s3.amazonaws.com/forum/` (prod). Unset: photos off |

The site's side is in the yaasa repo: `backend/forum.py`, branch `forum-v2`.

## Staging setup, step by step

Staging is `yaasa.herokuapp.com` (Heroku) + this repo's `v2` branch on Vercel (a Preview
deployment) + the `yaasalu-staging` Supabase project (schema already applied).

1. **A shared token.** On your machine: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`.
   Keep it for steps 3 and 5 only.

2. **Supabase keys.** `yaasalu-staging` → Project Settings → API Keys (the Legacy tab):
   the `anon` key and the `service_role` key.

3. **Vercel** (the existing racchabanda project):
   1. Settings → Environment Variables. For **Preview** (optionally only the `v2` branch), add:
      - `SUPABASE_URL` = `https://ritscmxzhvyzzkryyzkq.supabase.co`
      - `SUPABASE_ANON_KEY` = the anon key
      - `SUPABASE_SERVICE_ROLE_KEY` = the service_role key (tick **Sensitive**)
      - `FORUM_TOKEN` = the token from step 1 (Sensitive)
      - `SITE_API_URL` = `https://yaasa.herokuapp.com`

      Delete the old forum's variables (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_LOGIN_URL`,
      `DATABASE_URL`, ...), for Preview at least.
   2. Settings → Build and Deployment → **Node.js Version: 22.x** (`package.json` engines
      asks for it too).
   3. Settings → **Deployment Protection**: Vercel Authentication must not cover Preview
      deployments (choose "Only Production Deployments" or turn it off). Otherwise
      the site's nginx gets Vercel's login page instead of the forum.
   4. Deployments: a push to `v2` builds a Preview. Note its **branch URL**, the one that stays
      the same for every push, shaped like `racchabanda-git-v2-<team>.vercel.app` (Deployment →
      Domains). Open it directly once: the forum should render (unstyled is expected, as the
      site's stylesheets come from the site).

4. **GitHub** (this repo) → Settings → Secrets and variables → Actions → New repository secret:
   `SUPABASE_STAGING_URL` and `SUPABASE_STAGING_ANON_KEY`. Then Actions → "Supabase ping" →
   Run workflow: staging should log `HTTP 200`, prod `skipped`.

5. **Heroku staging** (`yaasa.herokuapp.com`) → Settings → Config Vars:
   - `FORUM_TOKEN` = the same token as Vercel's
   - `SUPABASE_URL` = `https://ritscmxzhvyzzkryyzkq.supabase.co`
   - `SUPABASE_ANON_KEY` = the anon key (not the service_role key)
   - `FORUM_VERCEL_HOST` = the branch URL's host from step 3.4 (no `https://`)
   - leave `FORUM_ENABLED` unset for now

   Then deploy the yaasa repo's `forum-v2` branch to staging the usual way.

6. **Check, then switch on.**
   - `https://yaasa.herokuapp.com/racchabanda` shows the forum in the site's header, with the
     sample threads.
   - Logged in on staging, the header shows you, and the thread page has a reply box.
   - Then set `FORUM_ENABLED=1` on staging: the menu gets రచ్చబండ, and word pages with
     threads show "రచ్చబండలో చర్చలు".

7. **Try it in a browser** (phone too):
   - start a thread from a word page's "ఈ పదం గురించి మాట్లాడండి" (the word is filled in);
   - type in English letters and get Telugu (the అ / A switch);
   - reply from a second account: the first account gets 🔔 and an email (if its address is in
     staging's `EMAIL_ALLOWLIST`);
   - tap stickers, open the + picker, tap again to take one back;
   - delete your own reply within 5 minutes;
   - the ☰ menu and the ప్రాంతాలు dropdown work.

**Photos on staging.** Run `supabase/migrations/002_photos.sql` in `yaasalu-staging`'s SQL Editor
(after 001), set `PHOTOS_BASE_URL` for Preview in Vercel, give the staging app's IAM user the
delete permission (yaasa `aws/s3/staging-app-policy.json`, second statement), and deploy the yaasa
branch that has `/api/forum/photo`.

**Sample data.** Staging has sample threads (authors `sample-...`). Before launch, remove them in
the SQL Editor: `delete from threads where author_id like 'sample-%';` (their replies and
stickers go with them).

## Production (later)

Create `yaasalu-prod`, run the migrations there (001, then 002), put its keys in Vercel's **Production**
environment (and `SITE_API_URL=https://www.yaasalu.com`), add the `SUPABASE_PROD_*` secrets for
the ping, set the prod site's config vars as in step 5 with the production Vercel host, merge
`v2` → `main` here and `forum-v2` → `master` in yaasa, then `FORUM_ENABLED=1` on prod.
