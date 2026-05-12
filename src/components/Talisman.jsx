// 1-bit talismans. one per page, max. punctuation, not decoration.
// all paths use currentColor so parent `color: var(--ink)` does the work.
// stroke-linecap and stroke-linejoin kept square for the pixel-art feeling.

const COMMON = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 100 100',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
  shapeRendering: 'crispEdges',
};

export default function Talisman({ name, size = 180, breathe = false, style }) {
  const Svg = VARIANTS[name];
  if (!Svg) return null;
  return (
    <div
      className={breathe ? 'talisman-breathe' : undefined}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        color: 'var(--ink)',
        opacity: 0.85,
        ...style,
      }}
      aria-hidden
    >
      <Svg />
    </div>
  );
}

// ─── moth ───────────────────────────────────────────────────────────
// front-facing, symmetric. circles-and-lines, deliberately primitive.
function Moth() {
  return (
    <svg {...COMMON} width="100%" height="100%">
      {/* body: head, thorax, abdomen */}
      <circle cx="50" cy="22" r="4" fill="currentColor" />
      <ellipse cx="50" cy="38" rx="3.5" ry="8" fill="currentColor" />
      <ellipse cx="50" cy="62" rx="3" ry="14" fill="currentColor" />
      {/* abdomen segments */}
      <line x1="47" y1="54" x2="53" y2="54" />
      <line x1="47" y1="60" x2="53" y2="60" />
      <line x1="47" y1="66" x2="53" y2="66" />
      <line x1="47" y1="72" x2="53" y2="72" />
      {/* antennae */}
      <path d="M48 18 Q 40 10 34 14" />
      <path d="M52 18 Q 60 10 66 14" />
      {/* forewings */}
      <path d="M48 30 Q 14 24 10 46 Q 14 56 30 56 Q 44 52 48 40 Z" />
      <path d="M52 30 Q 86 24 90 46 Q 86 56 70 56 Q 56 52 52 40 Z" />
      {/* hindwings */}
      <path d="M48 54 Q 22 60 22 76 Q 30 82 42 76 Q 48 70 48 60 Z" />
      <path d="M52 54 Q 78 60 78 76 Q 70 82 58 76 Q 52 70 52 60 Z" />
      {/* wing eyespots */}
      <circle cx="24" cy="44" r="3" />
      <circle cx="76" cy="44" r="3" />
      <circle cx="24" cy="44" r="1" fill="currentColor" />
      <circle cx="76" cy="44" r="1" fill="currentColor" />
      {/* vein hints */}
      <line x1="48" y1="38" x2="20" y2="38" />
      <line x1="52" y1="38" x2="80" y2="38" />
    </svg>
  );
}

// ─── hand ───────────────────────────────────────────────────────────
// open palm with an eye at center, small rays.
function Hand() {
  return (
    <svg {...COMMON} width="100%" height="100%">
      {/* rays */}
      <line x1="50" y1="4"  x2="50" y2="12" />
      <line x1="78" y1="18" x2="72" y2="24" />
      <line x1="22" y1="18" x2="28" y2="24" />
      <line x1="90" y1="50" x2="82" y2="50" />
      <line x1="10" y1="50" x2="18" y2="50" />
      {/* palm outline */}
      <path d="M30 40 L30 78 Q30 92 50 94 Q70 92 70 78 L70 40
               Q70 34 64 34 L64 22 Q64 16 58 16 Q52 16 52 22 L52 36
               L48 36 L48 16 Q48 10 42 10 Q36 10 36 16 L36 38
               L32 38 Q26 38 26 22 Q26 16 20 16 Q14 16 14 22 L14 54
               Q14 64 22 66 Q30 66 30 58 Z" />
      {/* eye in palm */}
      <ellipse cx="50" cy="60" rx="14" ry="8" />
      <circle cx="50" cy="60" r="4" fill="currentColor" />
      {/* lashes */}
      <line x1="38" y1="54" x2="34" y2="50" />
      <line x1="50" y1="50" x2="50" y2="45" />
      <line x1="62" y1="54" x2="66" y2="50" />
    </svg>
  );
}

// ─── eye ────────────────────────────────────────────────────────────
// single eye + sparkles around.
function Eye() {
  return (
    <svg {...COMMON} width="100%" height="100%">
      {/* sparkles */}
      <text x="12" y="20" fontSize="10" fill="currentColor" stroke="none" fontFamily="monospace">✦</text>
      <text x="82" y="22" fontSize="10" fill="currentColor" stroke="none" fontFamily="monospace">✦</text>
      <text x="14" y="86" fontSize="8"  fill="currentColor" stroke="none" fontFamily="monospace">·</text>
      <text x="82" y="84" fontSize="8"  fill="currentColor" stroke="none" fontFamily="monospace">·</text>
      {/* upper + lower lid */}
      <path d="M12 50 Q 50 18 88 50" />
      <path d="M12 50 Q 50 82 88 50" />
      {/* iris */}
      <circle cx="50" cy="50" r="14" />
      <circle cx="50" cy="50" r="6" fill="currentColor" />
      {/* lashes */}
      <line x1="20" y1="40" x2="18" y2="34" />
      <line x1="34" y1="30" x2="32" y2="24" />
      <line x1="50" y1="26" x2="50" y2="20" />
      <line x1="66" y1="30" x2="68" y2="24" />
      <line x1="80" y1="40" x2="82" y2="34" />
    </svg>
  );
}

// ─── butterfly ──────────────────────────────────────────────────────
function Butterfly() {
  return (
    <svg {...COMMON} width="100%" height="100%">
      {/* body */}
      <ellipse cx="50" cy="50" rx="2.5" ry="22" fill="currentColor" />
      <circle cx="50" cy="26" r="3" fill="currentColor" />
      {/* antennae */}
      <path d="M48 24 Q 42 14 36 14" />
      <path d="M52 24 Q 58 14 64 14" />
      {/* upper wings */}
      <path d="M47 32 Q 10 20 8 46 Q 14 58 36 54 Q 44 50 47 42 Z" />
      <path d="M53 32 Q 90 20 92 46 Q 86 58 64 54 Q 56 50 53 42 Z" />
      {/* lower wings */}
      <path d="M47 54 Q 18 58 22 80 Q 34 88 46 76 Q 48 68 47 60 Z" />
      <path d="M53 54 Q 82 58 78 80 Q 66 88 54 76 Q 52 68 53 60 Z" />
      {/* dots on wings */}
      <circle cx="22" cy="40" r="2" fill="currentColor" />
      <circle cx="78" cy="40" r="2" fill="currentColor" />
      <circle cx="32" cy="70" r="1.5" fill="currentColor" />
      <circle cx="68" cy="70" r="1.5" fill="currentColor" />
    </svg>
  );
}

// ─── black hole ─────────────────────────────────────────────────────
// concentric rings collapsing to a solid center.
function BlackHole() {
  return (
    <svg {...COMMON} width="100%" height="100%">
      <circle cx="50" cy="50" r="44" />
      <circle cx="50" cy="50" r="36" />
      <circle cx="50" cy="50" r="28" />
      <circle cx="50" cy="50" r="20" />
      <circle cx="50" cy="50" r="12" fill="currentColor" />
      {/* offset sparks to break the perfect symmetry */}
      <line x1="50" y1="2"  x2="50" y2="4" />
      <line x1="98" y1="50" x2="96" y2="50" />
      <line x1="50" y1="96" x2="50" y2="98" />
      <line x1="2"  y1="50" x2="4"  y2="50" />
    </svg>
  );
}

const VARIANTS = {
  moth: Moth,
  hand: Hand,
  eye: Eye,
  butterfly: Butterfly,
  'black-hole': BlackHole,
};
