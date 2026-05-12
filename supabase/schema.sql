-- kafka — schema
-- run once against a fresh supabase project.

create extension if not exists "pgcrypto";

-- works: the platonic book. one row per literary work regardless of edition.
create table works (
  id              uuid primary key default gen_random_uuid(),
  openlibrary_key text unique,
  title           text not null,
  author          text not null,
  original_year   int,
  created_at      timestamptz not null default now()
);

-- editions: specific printings/translations. reviews attach here, aggregate up to work.
create table editions (
  id             uuid primary key default gen_random_uuid(),
  work_id        uuid not null references works(id) on delete cascade,
  isbn           text unique,
  title          text not null,
  language       text not null,
  translator     text,
  publisher      text,
  published_year int,
  cover_url      text,
  created_at     timestamptz not null default now()
);

create index on editions (work_id);
create index on editions (language);

-- profiles: mirror of auth.users for app-level fields.
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text,
  bio          text,
  languages    text[] not null default '{}',
  created_at   timestamptz not null default now()
);

create index on profiles (lower(username));

-- reviews: the reason the app exists.
create table reviews (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  edition_id   uuid not null references editions(id) on delete cascade,
  body         text not null default '',
  language     text,
  status       text not null default 'draft' check (status in ('draft', 'published')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz,
  unique (user_id, edition_id)
);

create index on reviews (user_id, status);
create index on reviews (edition_id) where status = 'published';
create index on reviews (published_at desc) where status = 'published';

-- ratings: separate from reviews on purpose.
-- rating and writing are different acts. aggregates at the work level
-- (the star is about the book-as-object, not this particular translation).
-- integer 1-10, rendered as 0.5-5.0 half-stars.
create table ratings (
  user_id    uuid not null references auth.users(id) on delete cascade,
  work_id    uuid not null references works(id) on delete cascade,
  stars      int  not null check (stars between 1 and 10),
  created_at timestamptz not null default now(),
  primary key (user_id, work_id)
);

-- follows: taste graph, not friend graph.
create table follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

-- updated_at trigger for reviews.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger reviews_set_updated_at
  before update on reviews
  for each row execute function set_updated_at();

-- row level security.
alter table profiles enable row level security;
alter table reviews  enable row level security;
alter table ratings  enable row level security;
alter table follows  enable row level security;
alter table works    enable row level security;
alter table editions enable row level security;

create policy "profiles readable"      on profiles for select using (true);
create policy "profiles self-insert"   on profiles for insert with check (auth.uid() = id);
create policy "profiles self-update"   on profiles for update using (auth.uid() = id);

create policy "reviews readable" on reviews for select
  using (status = 'published' or user_id = auth.uid());
create policy "reviews self-write"  on reviews for insert with check (user_id = auth.uid());
create policy "reviews self-update" on reviews for update using (user_id = auth.uid());
create policy "reviews self-delete" on reviews for delete using (user_id = auth.uid());

create policy "ratings readable"   on ratings for select using (true);
create policy "ratings self-write" on ratings for all    using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "follows readable"   on follows for select using (true);
create policy "follows self-write" on follows for all    using (follower_id = auth.uid()) with check (follower_id = auth.uid());

create policy "works readable" on works    for select using (true);
create policy "works insert"   on works    for insert with check (auth.role() = 'authenticated');

create policy "editions readable" on editions for select using (true);
create policy "editions insert"   on editions for insert with check (auth.role() = 'authenticated');

-- ─── v1.1 additions ────────────────────────────────────────────────
-- this block is idempotent: safe to re-run on an existing kafka schema.
-- curated reading lists. a list is a title + description + ordered editions.
-- not a status tracker — it's an essay you wrote about what to read next.
create table if not exists lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  is_public   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists kafka_v11_idx_1 on lists (user_id, updated_at desc);

create table if not exists list_items (
  list_id    uuid not null references lists(id) on delete cascade,
  edition_id uuid not null references editions(id) on delete cascade,
  position   int  not null default 0,
  note       text,
  added_at   timestamptz not null default now(),
  primary key (list_id, edition_id)
);
create index if not exists kafka_v11_idx_2 on list_items (list_id, position);

-- currently reading. private to the user, one row per work.
-- shown only on own profile. not exposed in the feed.
create table if not exists reading (
  user_id    uuid not null references auth.users(id) on delete cascade,
  edition_id uuid not null references editions(id) on delete cascade,
  started_at timestamptz not null default now(),
  primary key (user_id, edition_id)
);
create index if not exists kafka_v11_idx_3 on reading (user_id, started_at desc);

-- comments on reviews. single-level. no like counts ever.
create table if not exists review_comments (
  id         uuid primary key default gen_random_uuid(),
  review_id  uuid not null references reviews(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  body       text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);
create index if not exists kafka_v11_idx_4 on review_comments (review_id, created_at);

-- bookmarks. save a published review to read later.
create table if not exists bookmarks (
  user_id    uuid not null references auth.users(id) on delete cascade,
  review_id  uuid not null references reviews(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, review_id)
);
create index if not exists kafka_v11_idx_5 on bookmarks (user_id, created_at desc);

-- editorial picks. hand-curated reviews shown on the 'editorial' feed tab
-- and (top one) on the signed-out landing page.
create table if not exists editorial_picks (
  review_id uuid primary key references reviews(id) on delete cascade,
  note      text,
  position  int  not null default 0,
  added_at  timestamptz not null default now()
);
create index if not exists kafka_v11_idx_6 on editorial_picks (position, added_at desc);

-- notifications. in-app only. never sent by email.
-- kinds: 'follow' | 'comment' | 'list_add' | 'bookmark'
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,  -- recipient
  actor_id   uuid references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('follow','comment','list_add','bookmark')),
  review_id  uuid references reviews(id) on delete cascade,
  comment_id uuid references review_comments(id) on delete cascade,
  list_id    uuid references lists(id) on delete cascade,
  edition_id uuid references editions(id) on delete cascade,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists kafka_v11_idx_7 on notifications (user_id, created_at desc);
create index if not exists kafka_v11_idx_8 on notifications (user_id, read_at) where read_at is null;

-- updated_at triggers
drop trigger if exists lists_set_updated_at on lists;
create trigger lists_set_updated_at
  before update on lists
  for each row execute function set_updated_at();

-- ─── notification triggers ─────────────────────────────────────────
-- follow → notify the followee.
create or replace function notify_follow()
returns trigger language plpgsql security definer as $$
begin
  insert into notifications (user_id, actor_id, kind)
  values (new.followee_id, new.follower_id, 'follow');
  return new;
end $$;

drop trigger if exists follows_notify on follows;
create trigger follows_notify
  after insert on follows
  for each row execute function notify_follow();

-- comment → notify the review's author (skip self-comments).
create or replace function notify_comment()
returns trigger language plpgsql security definer as $$
declare
  review_author uuid;
begin
  select user_id into review_author from reviews where id = new.review_id;
  if review_author is not null and review_author <> new.user_id then
    insert into notifications (user_id, actor_id, kind, review_id, comment_id)
    values (review_author, new.user_id, 'comment', new.review_id, new.id);
  end if;
  return new;
end $$;

drop trigger if exists review_comments_notify on review_comments;
create trigger review_comments_notify
  after insert on review_comments
  for each row execute function notify_comment();

-- bookmark → notify the review's author (skip self).
create or replace function notify_bookmark()
returns trigger language plpgsql security definer as $$
declare
  review_author uuid;
begin
  select user_id into review_author from reviews where id = new.review_id;
  if review_author is not null and review_author <> new.user_id then
    insert into notifications (user_id, actor_id, kind, review_id)
    values (review_author, new.user_id, 'bookmark', new.review_id);
  end if;
  return new;
end $$;

drop trigger if exists bookmarks_notify on bookmarks;
create trigger bookmarks_notify
  after insert on bookmarks
  for each row execute function notify_bookmark();

-- RLS
alter table lists            enable row level security;
alter table list_items       enable row level security;
alter table reading          enable row level security;
alter table review_comments  enable row level security;
alter table bookmarks        enable row level security;
alter table editorial_picks  enable row level security;
alter table notifications    enable row level security;

drop policy if exists "lists readable" on lists;
create policy "lists readable" on lists for select
  using (is_public or user_id = auth.uid());
drop policy if exists "lists self-write" on lists;
create policy "lists self-write" on lists for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "list_items readable" on list_items;
create policy "list_items readable" on list_items for select
  using (exists (select 1 from lists l where l.id = list_items.list_id
                 and (l.is_public or l.user_id = auth.uid())));
drop policy if exists "list_items self-write" on list_items;
create policy "list_items self-write" on list_items for all
  using (exists (select 1 from lists l where l.id = list_items.list_id and l.user_id = auth.uid()))
  with check (exists (select 1 from lists l where l.id = list_items.list_id and l.user_id = auth.uid()));

-- reading is fully private.
drop policy if exists "reading self-read" on reading;
create policy "reading self-read"  on reading for select using (user_id = auth.uid());
drop policy if exists "reading self-write" on reading;
create policy "reading self-write" on reading for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- comments: anyone authenticated can read; user can write their own;
-- both the comment author AND the review author can delete.
drop policy if exists "comments readable" on review_comments;
create policy "comments readable" on review_comments for select using (true);
drop policy if exists "comments self-insert" on review_comments;
create policy "comments self-insert" on review_comments for insert with check (user_id = auth.uid());
drop policy if exists "comments delete" on review_comments;
create policy "comments delete" on review_comments for delete
  using (user_id = auth.uid()
         or auth.uid() = (select user_id from reviews where id = review_comments.review_id));

drop policy if exists "bookmarks self-read" on bookmarks;
create policy "bookmarks self-read"  on bookmarks for select using (user_id = auth.uid());
drop policy if exists "bookmarks self-write" on bookmarks;
create policy "bookmarks self-write" on bookmarks for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "editorial readable" on editorial_picks;
create policy "editorial readable" on editorial_picks for select using (true);
-- editorial_picks is curator-only; no insert policy for end users.
-- the founder writes rows from the supabase SQL editor.

drop policy if exists "notifications self-read" on notifications;
create policy "notifications self-read" on notifications for select using (user_id = auth.uid());
drop policy if exists "notifications self-update" on notifications;
create policy "notifications self-update" on notifications for update using (user_id = auth.uid());
drop policy if exists "notifications self-delete" on notifications;
create policy "notifications self-delete" on notifications for delete using (user_id = auth.uid());
-- inserts happen via triggers in security-definer functions, not directly.
