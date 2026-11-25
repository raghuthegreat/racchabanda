-- రచ్చబండ: live updates. Run once per project after 004 (staging, then prod):
-- Dashboard -> SQL Editor -> paste -> Run.
--
-- Adds the forum's public tables to Supabase Realtime's stream, so open pages hear about new
-- replies, edits, deletions, stickers and thread activity (components/chat/Live.js) and refresh.
-- Browsers listen with the public key, and Realtime applies the same row-level security as a
-- read: anyone may read threads, posts and reactions (001), and nothing else. thread_reads (004)
-- is not added and stays private. Writing still goes only through the forum's server.

do $$
declare t text;
begin
  foreach t in array array['threads', 'posts', 'reactions'] loop
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Check: should list exactly threads, posts, reactions
select tablename from pg_publication_tables where pubname = 'supabase_realtime' order by tablename;
