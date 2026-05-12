import { useRef } from 'react';

// stars are prosody, not a headline. render small, muted.
// value is 1-10 (half-stars × 2); displayed as ½-star units.
//
// interactive mode = 10 half-star hit targets paired into 5 stars.
// keyboard: arrow left/right steps focus across positions; enter/space sets.
// clicking the current value clears the rating.

const EMPTY = '☆';
const HALF = '⯪';
const FULL = '★';

export default function Stars({ value = 0, onChange, size = 18, muted = true }) {
  const interactive = !!onChange;

  if (!interactive) {
    return (
      <span
        aria-label={`${value / 2} out of 5`}
        style={{
          fontSize: size,
          color: muted ? 'var(--muted)' : 'var(--ink)',
          letterSpacing: '0.06em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {renderStatic(value)}
      </span>
    );
  }

  return <InteractiveStars value={value} onChange={onChange} size={size} />;
}

function InteractiveStars({ value, onChange, size }) {
  const refs = useRef([]);
  const positions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  function onKeyDown(e, idx) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      refs.current[Math.max(0, idx - 1)]?.focus();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      refs.current[Math.min(9, idx + 1)]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      refs.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      refs.current[9]?.focus();
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      onChange(0);
    }
  }

  return (
    <span
      role="group"
      aria-label="rating"
      style={{
        display: 'inline-flex',
        gap: 2,
        fontSize: size,
        color: 'var(--ink)',
        lineHeight: 1,
      }}
    >
      {positions.map((p, idx) => (
        <button
          key={p}
          ref={(el) => (refs.current[idx] = el)}
          onClick={() => onChange(value === p ? 0 : p)}
          onKeyDown={(e) => onKeyDown(e, idx)}
          aria-label={`${p / 2} of 5`}
          aria-pressed={p <= value}
          title={`${p / 2}`}
          style={{
            width: '0.55em',
            height: '1em',
            overflow: 'hidden',
            position: 'relative',
            padding: 0,
            color: p <= value ? 'var(--ink)' : 'var(--hairline)',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: p % 2 === 1 ? 0 : '-0.55em',
              top: 0,
            }}
          >
            {FULL}
          </span>
        </button>
      ))}
    </span>
  );
}

function renderStatic(value) {
  const full = Math.floor(value / 2);
  const half = value % 2 === 1;
  const empty = 5 - full - (half ? 1 : 0);
  return FULL.repeat(full) + (half ? HALF : '') + EMPTY.repeat(empty);
}
