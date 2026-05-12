-- one-shot fix for PostgREST relationship resolution.
--
-- problem: every table that wants to embed `profile:profiles(...)` from
-- userland code (reviews, review_comments, lists, etc.) has its user_id FK
-- pointing at auth.users(id). profiles.id also points at auth.users(id).
-- PostgREST doesn't follow transitive FKs through a shared parent — so
-- `select=*,profile:profiles(...)` returns PGRST200 "could not find a
-- relationship between 'reviews' and 'profiles'".
--
-- fix: drop the auth.users FK on those columns and re-point them at
-- profiles.id. profiles.id is a foreign key to auth.users(id) with
-- ON DELETE CASCADE, so the auth-cascade still fires through profiles.
-- this trades one column constraint for another with identical semantics;
-- no data migration needed.
--
-- safe to run multiple times: each block drops the old constraint if it
-- exists and recreates pointing at profiles.

-- reviews
alter table reviews drop constraint if exists reviews_user_id_fkey;
alter table reviews
  add constraint reviews_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

-- review_comments
alter table review_comments drop constraint if exists review_comments_user_id_fkey;
alter table review_comments
  add constraint review_comments_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

-- lists
alter table lists drop constraint if exists lists_user_id_fkey;
alter table lists
  add constraint lists_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

-- notifications.actor_id (the column we join to "actor" in the Inbox)
alter table notifications drop constraint if exists notifications_actor_id_fkey;
alter table notifications
  add constraint notifications_actor_id_fkey
  foreign key (actor_id) references profiles(id) on delete cascade;

-- ask PostgREST to reload its schema cache so the new relationships are
-- picked up without a project restart. Supabase auto-reloads anyway, but
-- this makes it instant.
notify pgrst, 'reload schema';
