# kafka

A writing-first book app. Persian/Dari and English from the first commit. No
reading streaks, no leaderboards, no "books read this year" counter. Reviews
are the product.

→ **Live:** https://kafka-prototype.vercel.app/
→ **About:** [`/about`](https://kafka-prototype.vercel.app/about)
→ **Repo:** https://github.com/MurtazaKafka/kafka

---

## Statement

Kafka is a writing-first book app. The premise is narrow on purpose: reviews
are the product. Stars are prosody next to prose. The review editor is the
app, not the feed, not the profile, not the rating widget. If writing a
review here doesn't feel better than writing one anywhere else, nothing else
matters.

The norm Kafka breaks is the Goodreads-shape one: the
social-graph-plus-quantification stack where engagement is driven by reading
streaks, yearly goals, "books read this year" counters, leaderboards,
algorithmic ranking of which reviewers are popular. Kafka refuses all of it.
There are no statistics on the profile page. The feed is reverse
chronological. There is no trending, no discover, no recommendations. The
retention strategy is: be the place someone wants to come write in, not the
place they have to come back to.

Bilingual from the first commit. Persian and Dari are first-class, not a
localization layer bolted on, but a typographic decision. A single font stack
(JetBrains Mono falling through to Vazirmatn for Arabic-script characters)
and `unicode-bidi: plaintext` so direction switches per paragraph from
content. A Farsi review of Forough Farrokhzad sits beside an English review
of Ishiguro, and neither is the translated sibling.

Built on Vite, React, and Supabase. The editor is a plaintext-only
`contenteditable` div, no rich-text library, no Markdown rendering, no
toolbar. Book covers are Bayer-8×8-dithered to a single ink color on the
paper background, the one piece of the prototype's aesthetic vocabulary that
carried over. ASCII talismans sit in empty states as punctuation rather than
ornament.

---

## Concept

Kafka is for people who write paragraphs about books, not people who tap
five stars. The target user finishes a book and sits down to think about it
in prose and wants a surface that does not get in the way of that.

**Why it matters.** Reading apps have converged on engagement-driven
patterns: streaks, yearly challenges, badges, "popular reviewers"
leaderboards. These patterns produce performative reading, the act of
posting overtakes the act of reading. They also exclude readers whose lives
do not map onto a Gregorian calendar of finished books. Kafka's refusal of
these patterns is its concept.

**Why bilingual.** Persian-language literature is poorly served by English-
first reading platforms. The text rendering is wrong (no RTL, system fallback
fonts), the search is wrong (titles not indexed), and the social context is
wrong (the user is the only Persian-reader in their feed). Solving these
problems is not a localization task, it's a typography and architecture
task, which has to be done from the first commit or it doesn't get done.

## Audience

A user story:

> A hypothetical Maryam is a graduate student in Persian literature. She finishes
> *Tavalodi Digar* late one night and wants to write about it, in Farsi,
> without first having to fight a text field that thinks her language is
> exotic. She wants the writing surface to disappear. She wants the page to
> render in Vazirmatn, RTL, without her ticking a setting. She wants her
> friend who reads in English to be able to find what she wrote.

## Competition scan

- **Goodreads** — the inheritance the project is refusing. Engagement
  metrics, public-shelf social pressure, opaque algorithmic ranking. Owned
  by Amazon.
- **The StoryGraph** — better aesthetic, still organized around stats and
  "moods." Bilingual writing surfaces are not a goal.
- **Five Books** — the inverse of Kafka: editorially curated, no user
  writing. Kafka borrows their *selection sensibility* (the curated editorial
  picks under `@kafka`) but pushes the platform back toward user prose.

## Technology

**Stack.** Vite + React 18, Supabase (Postgres + Auth + RLS), Zustand for
client state, React Router for routing. No rich-text library. No CSS
framework, design tokens in `src/tokens.css`, single ~680px column.

**Editor.** `contenteditable="plaintext-only"` div with
`unicode-bidi: plaintext`. Per-paragraph script detection writes a language
tag on each saved review. Autosave debounces to 800 ms. Drafts persist;
publishing flips a status flag.

**Image pipeline.** `applyDithering()` in `src/lib/dither.js` runs a
Bayer-8×8 ordered dither over canvas pixels, replacing tones above the
threshold with paper and tones below with ink. Cached by URL.

**Schema highlights.** Works and editions are peers (no "preferred edition"
flag, a Farsi edition is equally real as the English). Ratings live at the
work level; reviews at the edition level. Lists, comments, bookmarks,
notifications, and an editorial-picks table sit alongside.

**Routes.**
- `/` — landing (signed-out) or feed (signed-in)
- `/auth`, `/auth/callback`, `/auth/username` — magic-link sign-in flow
- `/search` — Open Library + user-added books, with parallel transliteration
  search for Persian queries
- `/write/:edition_id` — the editor
- `/book/:work_id` — work page, reviews grouped by language
- `/edition/:edition_id` — edition page, rating prompt, comments
- `/@:username` — public profile (their reviews, lists)
- `/lists`, `/list/:id`, `/saved`, `/notifications`, `/drafts`,
  `/import`, `/settings`, `/about`

## Separation of concerns

Three layers, deliberately disjoint:

1. **`src/lib/`** — pure logic. Dither math, OpenLibrary client,
   transliteration, language detection, Supabase client config. No React.
2. **`src/store/session.js`** — single Zustand store for the auth state.
   Pages subscribe; nothing reaches into Supabase auth directly.
3. **`src/pages/` and `src/components/`** — React. Pages own their queries
   (they're the natural unit of data scope); components are presentational
   except where they hold their own UI state (e.g. `Comments`).

The editor is its own folder (`src/editor/`) because the writing surface is
the app's core thesis and should be modifiable without touching anything
else.

## Build & run

```bash
npm install
cp .env.example .env  # then paste your Supabase URL + anon key
npm run dev           # → http://localhost:5173
npm run build         # production build (Vercel runs this)
```

### Database setup

In the Supabase SQL editor, run in order:

1. `supabase/schema.sql` — tables, indexes, RLS, triggers
2. `supabase/fix_postgrest_joins.sql` — re-points user-id FKs at `profiles`
   so PostgREST can resolve nested `profile:profiles(...)` embeds
3. `supabase/seed_editorial.sql` — 12 curated editorial picks under
   `@kafka` (requires that profile to exist first; sign in once with
   username `kafka` before running)

## Deliverables

- **Live project:** see top of README
- **About page in the app:** `/about`
- **Source:** this repo
- **Video walkthrough:** `docs/walkthrough.mp4` *(recorded separately)*
- **Design layouts:** *(Figma link — paste here when posting)*
- **Updated proposal:** this README is the updated proposal

## Attribution

Editorial picks are selections inspired by recommendations on
[Five Books](https://fivebooks.com). The review prose under those picks is
written for Kafka — Five Books text is not copied.
