// language/script helpers.
// kafka is bilingual from the first commit, so these run everywhere text is shown.

// rtl scripts we care about: hebrew + arabic family (persian, dari, pashto, urdu, etc).
// 0590–05FF hebrew · 0600–06FF arabic · 0750–077F arabic suppl · 08A0–08FF arabic ext-a
// FB50–FDFF presentation forms-a · FE70–FEFF presentation forms-b
const RTL_RE = /[֐-׿؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

// latin-only path (skips rtl detection).
const LATIN_RE = /[A-Za-z]/;

export function hasRTL(s) {
  return !!s && RTL_RE.test(s);
}

// returns a language tag guess from text content.
// 'fa' for persian/arabic script, 'en' for latin, null for unknown (empty, emoji, etc).
// this is intentionally rough — it's used for the review's language field, which
// the user can override. the real job here is picking vazirmatn vs jetbrains mono.
export function detectLanguage(text) {
  if (!text) return null;
  if (RTL_RE.test(text)) return 'fa';
  if (LATIN_RE.test(text)) return 'en';
  return null;
}

// returns an array of distinct scripts present, for the status bar hint.
// ex: "EN · FA"
export function detectScripts(text) {
  if (!text) return [];
  const out = [];
  if (LATIN_RE.test(text)) out.push('EN');
  if (RTL_RE.test(text)) out.push('FA');
  return out;
}
