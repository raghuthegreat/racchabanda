-- రచ్చబండ: photos on threads and replies. Run once per project after 001 (staging, then prod):
-- Dashboard -> SQL Editor -> paste -> Run.
--
-- A photo is {full, thumb, w, h}: the addresses of the resized photo (2048px) and its thumbnail
-- (480px) in the site's S3 bucket under forum/, and the full photo's size (so pages reserve the
-- space before it loads). At most 4 per post. The files themselves are uploaded by the browser
-- straight to S3 with a signature from the site (yaasa backend/forum.py /api/forum/photo).

alter table public.threads add column photos jsonb not null default '[]'::jsonb
  constraint threads_photos_list check (jsonb_typeof(photos) = 'array' and jsonb_array_length(photos) <= 4);

alter table public.posts add column photos jsonb not null default '[]'::jsonb
  constraint posts_photos_list check (jsonb_typeof(photos) = 'array' and jsonb_array_length(photos) <= 4);

-- A reply may be only photos: its text can be empty when it has at least one photo.
alter table public.posts drop constraint posts_body_check;
alter table public.posts add constraint posts_body_check
  check (char_length(body) <= 5000 and (char_length(btrim(body)) >= 1 or jsonb_array_length(photos) >= 1));
