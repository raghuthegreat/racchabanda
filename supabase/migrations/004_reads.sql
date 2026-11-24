-- రచ్చబండ: unread counts. One row per person per thread they have opened: when they last read
-- it. Counts aren't stored; they're counted from posts when the list is shown. Run once per
-- project after 003 (staging, then prod).
--
-- Private: what someone has read is nobody else's business. Row-level security is on with no
-- policies and every right revoked from the public roles, so only the forum's server (the
-- service-role key) reads or writes this table or calls the functions.

create table public.thread_reads (
  user_id      text not null check (user_id <> ''),
  thread_id    bigint not null references public.threads (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, thread_id)
);

alter table public.thread_reads enable row level security;
revoke all on public.thread_reads from anon, authenticated;

-- Opening a thread: now read up to this moment (never moves back)
create function public.mark_read(p_user text, p_thread bigint) returns void
language sql
set search_path = ''
as $$
  insert into public.thread_reads (user_id, thread_id, last_read_at) values (p_user, p_thread, now())
  on conflict (user_id, thread_id) do update set last_read_at = greatest(public.thread_reads.last_read_at, excluded.last_read_at)
$$;

-- For the threads on screen that this person has opened before: how many replies by others came
-- after they last read it, and the first of them (where the thread opens)
create function public.unread_counts(p_user text, p_threads bigint[])
returns table (thread_id bigint, unread integer, first_unread bigint)
language sql stable
set search_path = ''
as $$
  select r.thread_id,
         count(p.id)::integer,
         (array_agg(p.id order by p.created_at, p.id))[1]
    from public.thread_reads r
    left join public.posts p
      on p.thread_id = r.thread_id and p.created_at > r.last_read_at and p.author_id <> p_user
   where r.user_id = p_user and r.thread_id = any (p_threads)
   group by r.thread_id
$$;

revoke execute on function public.mark_read(text, bigint) from public, anon, authenticated;
revoke execute on function public.unread_counts(text, bigint[]) from public, anon, authenticated;
