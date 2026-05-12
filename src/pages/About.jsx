import { Link } from 'react-router-dom';
import Wordmark from '../components/Wordmark.jsx';
import Divider from '../components/Divider.jsx';
import Talisman from '../components/Talisman.jsx';

// /about — the project statement, in the app. linked from Nav and Landing.
// kept to the same single-column paper surface as everything else.
export default function About() {
  return (
    <div className="col" style={{ padding: 'var(--s-6) 0' }}>
      <Wordmark size={22} />
      <div
        style={{
          textAlign: 'center',
          marginTop: 'var(--s-3)',
          color: 'var(--muted)',
          fontSize: 'var(--t-small)',
        }}
      >
        about this project
      </div>

      <div style={{ textAlign: 'center', margin: 'var(--s-5) 0' }}>
        <Talisman name="hand" size={180} breathe />
      </div>

      <Divider />

      <article
        className="plaintext"
        style={{
          fontSize: 'var(--t-body)',
          lineHeight: 1.85,
          padding: 'var(--s-3) 0',
        }}
      >
        <p>
          Kafka is a writing-first book app. The premise is narrow on
          purpose: reviews are the product. Stars are prosody next to
          prose. The review editor is the app, not the feed, not the
          profile, not the rating widget. If writing a review here doesn't
          feel better than writing one anywhere else, nothing else matters.
        </p>

        <p>
          The norm Kafka breaks is the Goodreads-shape one: the
          social-graph-plus-quantification stack where engagement is driven
          by reading streaks, yearly goals, "books read this year"
          counters, leaderboards, algorithmic ranking of which reviewers
          are popular. Kafka refuses all of it. There are no statistics on
          the profile page. The feed is reverse-chronological. There is no
          trending, no discover, no recommendations. The retention
          strategy is: be the place someone wants to come write in, not
          the place they have to come back to.
        </p>

        <p>
          Bilingual from the first commit. Persian and Dari are
          first-class, not a localization layer bolted on, but a
          typographic decision. A single font stack (JetBrains Mono
          falling through to Vazirmatn for Arabic-script characters) and{' '}
          <code style={{ fontFamily: 'var(--font)' }}>
            unicode-bidi: plaintext
          </code>{' '}
          so direction switches per paragraph from content. A Farsi review
          of Forough Farrokhzad sits beside an English review of Ishiguro,
          and neither is the translated sibling.
        </p>

        <p>
          Built on Vite, React, and Supabase. The editor is a
          plaintext-only{' '}
          <code style={{ fontFamily: 'var(--font)' }}>contenteditable</code>{' '}
          div, no rich-text library, no Markdown rendering, no toolbar.
          Book covers are Bayer-8×8-dithered to a single ink color on the
          paper background, the one piece of the prototype's aesthetic
          vocabulary that carried over. ASCII talismans sit in empty
          states as punctuation rather than ornament. Hairlines separate
          sections; no boxes, no shadows, no rounded corners. The whole
          app is meant to read as one continuous surface of paper.
        </p>
      </article>

      <Divider label="links" />

      <div
        className="upper"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 'var(--s-3)',
          padding: 'var(--s-2) 0',
        }}
      >
        <a
          href="https://github.com/MurtazaKafka/kafka"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--muted)' }}
        >
          source
        </a>
        <a
          href="https://fivebooks.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--muted)' }}
        >
          editorial selections via Five Books
        </a>
      </div>

      <Divider />

      <div className="upper" style={{ textAlign: 'center' }}>
        <Link to="/" style={{ color: 'var(--muted)' }}>
          ← home
        </Link>
      </div>
    </div>
  );
}
