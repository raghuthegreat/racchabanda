-- రచ్చబండ v2: threads, their replies (posts) and sticker reactions.
-- Run once per Supabase project: yaasalu-staging first, then yaasalu-prod
-- (Dashboard -> SQL Editor -> paste -> Run). It refuses to run twice (create table fails).
--
-- People are the site's users: author_id / user_id is the Google id, the same as Mongo
-- users.id on yaasalu. Names and photos are copied in when someone posts, so pages need no
-- call to the site to show them.
--
-- Who can do what:
--   anyone (the public "anon" key, the browser, the site's word pages): read
--   the forum's server (the service-role key, which bypasses row-level security): write
-- There are no insert/update/delete policies, and those rights are revoked from the public
-- roles too, so the public key can never write, whatever a policy says later.

-- ---------------------------------------------------------------- threads
create table public.threads (
  id               bigint generated always as identity primary key,
  title            text not null check (char_length(btrim(title)) between 1 and 200),
  body             text not null default '' check (char_length(body) <= 5000),
  author_id        text not null check (author_id <> ''),
  author_name      text not null default '',
  author_pic       text not null default '',
  word             text check (word is null or char_length(btrim(word)) between 1 and 100),
  region           text check (region is null or char_length(btrim(region)) between 1 and 100),
  reply_count      integer not null default 0 check (reply_count >= 0),
  last_activity_at timestamptz not null default now(),
  last_author_name text not null default '',
  last_author_pic  text not null default '',
  pinned           boolean not null default false,
  source           text not null default 'site' check (source in ('site', 'instagram')),
  created_at       timestamptz not null default now(),
  edited_at        timestamptz
);

-- The front page: pinned first, then latest activity (id breaks ties for stable paging)
create index threads_stream_idx on public.threads (pinned desc, last_activity_at desc, id desc);
-- A word's threads (the word page, the పదాలు chip) and a region's (the region chips)
create index threads_word_idx on public.threads (word, last_activity_at desc) where word is not null;
create index threads_region_idx on public.threads (region, last_activity_at desc) where region is not null;
-- Per-person write limits ("N threads in the last hour")
create index threads_author_idx on public.threads (author_id, created_at desc);

-- ---------------------------------------------------------------- posts (replies)
create table public.posts (
  id          bigint generated always as identity primary key,
  thread_id   bigint not null references public.threads (id) on delete cascade,
  author_id   text not null check (author_id <> ''),
  author_name text not null default '',
  author_pic  text not null default '',
  body        text not null check (char_length(btrim(body)) between 1 and 5000),
  source      text not null default 'site' check (source in ('site', 'instagram')),
  created_at  timestamptz not null default now(),
  edited_at   timestamptz
);

-- A thread's replies in order
create index posts_thread_idx on public.posts (thread_id, created_at, id);
create index posts_author_idx on public.posts (author_id, created_at desc);

-- ---------------------------------------------------------------- reactions (stickers)
-- On a thread's first post (post_id null) or on one reply. thread_id is always set, so one
-- query loads a whole thread's stickers, and deleting a thread or reply removes its stickers.
create table public.reactions (
  id         bigint generated always as identity primary key,
  thread_id  bigint not null references public.threads (id) on delete cascade,
  post_id    bigint references public.posts (id) on delete cascade,
  user_id    text not null check (user_id <> ''),
  sticker    text not null check (sticker ~ '^[a-z0-9_]{1,30}$'),   -- a code: keka, dandam, ...
  created_at timestamptz not null default now(),
  -- Each person gives each sticker once per post; "nulls not distinct" makes that hold on the
  -- first post too, where post_id is null
  constraint reactions_once unique nulls not distinct (thread_id, post_id, user_id, sticker)
);

create index reactions_thread_idx on public.reactions (thread_id);

-- ---------------------------------------------------------------- keeping a thread's counters
-- reply_count, last_activity_at and the last replier change with every reply. A trigger keeps
-- them right whoever writes (the forum, the Instagram importer, a hand fix in the dashboard).
-- Imported replies keep their old dates, so last activity never moves backwards.
create function public.thread_after_post() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.threads
       set reply_count      = reply_count + 1,
           last_activity_at = greatest(last_activity_at, new.created_at),
           last_author_name = case when new.created_at >= last_activity_at then new.author_name else last_author_name end,
           last_author_pic  = case when new.created_at >= last_activity_at then new.author_pic  else last_author_pic  end
     where id = new.thread_id;
    return new;
  else  -- DELETE: one reply fewer; last activity stays (something did happen then)
    update public.threads
       set reply_count = greatest(reply_count - 1, 0)
     where id = old.thread_id;
    return old;
  end if;
end;
$$;

create trigger posts_counters
after insert or delete on public.posts
for each row execute function public.thread_after_post();

-- ---------------------------------------------------------------- who can read and write
alter table public.threads   enable row level security;
alter table public.posts     enable row level security;
alter table public.reactions enable row level security;

create policy "anyone can read threads"   on public.threads   for select to anon, authenticated using (true);
create policy "anyone can read posts"     on public.posts     for select to anon, authenticated using (true);
create policy "anyone can read reactions" on public.reactions for select to anon, authenticated using (true);

revoke insert, update, delete, truncate on public.threads, public.posts, public.reactions from anon, authenticated;
revoke execute on function public.thread_after_post() from public, anon, authenticated;
