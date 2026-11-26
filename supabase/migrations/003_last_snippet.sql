-- రచ్చబండ: the newest reply's first words on each thread, for the chat-list front page
-- ("వాణి: విజయనగరం, బొబ్బిలి రెండూ"). Run once per project after 002 (staging, then prod).
--
-- last_snippet is kept by the same trigger as reply_count and the last replier, so it is right
-- whoever writes: a new reply sets it (if it is the newest), editing the newest reply updates it,
-- and deleting the newest reply falls back to the one before (or empty: no replies).

alter table public.threads add column last_snippet text not null default '';

-- A reply's first 120 characters on one line; a photo-only reply reads "📷 ఫోటో"
create function public.post_snippet(body text, photos jsonb) returns text
language sql immutable
set search_path = ''
as $$
  select case
    when btrim(coalesce(body, '')) = '' and jsonb_array_length(coalesce(photos, '[]'::jsonb)) > 0 then '📷 ఫోటో'
    else left(regexp_replace(btrim(coalesce(body, '')), '\s+', ' ', 'g'), 120)
  end
$$;

create or replace function public.thread_after_post() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  newest record;
begin
  if tg_op = 'INSERT' then
    update public.threads
       set reply_count      = reply_count + 1,
           last_activity_at = greatest(last_activity_at, new.created_at),
           last_author_name = case when new.created_at >= last_activity_at then new.author_name else last_author_name end,
           last_author_pic  = case when new.created_at >= last_activity_at then new.author_pic  else last_author_pic  end,
           last_snippet     = case when new.created_at >= last_activity_at then public.post_snippet(new.body, new.photos) else last_snippet end
     where id = new.thread_id;
    return new;
  end if;

  -- The thread's newest reply now (after an edit or a delete)
  select p.id, p.author_name, p.author_pic, p.body, p.photos into newest
    from public.posts p
   where p.thread_id = coalesce(new.thread_id, old.thread_id)
   order by p.created_at desc, p.id desc
   limit 1;

  if tg_op = 'UPDATE' then   -- an edit: only the newest reply's words show on the list
    if newest.id = new.id then
      update public.threads set last_snippet = public.post_snippet(new.body, new.photos) where id = new.thread_id;
    end if;
    return new;
  end if;

  -- DELETE: one reply fewer; last activity stays (something did happen then); the list shows the
  -- reply before it, or nothing when none are left
  update public.threads
     set reply_count      = greatest(reply_count - 1, 0),
         last_author_name = coalesce(newest.author_name, ''),
         last_author_pic  = coalesce(newest.author_pic, ''),
         last_snippet     = coalesce(public.post_snippet(newest.body, newest.photos), '')
   where id = old.thread_id;
  return old;
end;
$$;

drop trigger posts_counters on public.posts;
create trigger posts_counters
after insert or delete or update of body, photos on public.posts
for each row execute function public.thread_after_post();

revoke execute on function public.thread_after_post() from public, anon, authenticated;

-- Existing threads: their newest reply's words now
update public.threads t
   set last_snippet = public.post_snippet(p.body, p.photos)
  from (select distinct on (thread_id) thread_id, body, photos
          from public.posts order by thread_id, created_at desc, id desc) p
 where p.thread_id = t.id;
