// best-effort persian/arabic → latin transliteration for search fallback.
// this is NOT a linguistically correct romanization — it's a pragmatic map
// that boosts openlibrary hit rate when users type "فروغ فرخزاد" and the
// book is only indexed as "forough farrokhzad."
//
// rules kept simple on purpose: each letter → its most common latin form.
// diacritics/harakat stripped. alef variants collapsed. final-form yeh collapsed.

const MAP = {
  // alef + hamza variants
  'ا': 'a', 'آ': 'a', 'أ': 'a', 'إ': 'e', 'ٱ': 'a', 'ء': "'",
  // bcd...
  'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's',
  'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'zh',
  'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z',
  'ط': 't', 'ظ': 'z', 'ع': "'", 'غ': 'gh',
  'ف': 'f', 'ق': 'q', 'ك': 'k', 'ک': 'k', 'گ': 'g',
  'ل': 'l', 'م': 'm', 'ن': 'n',
  'و': 'o', 'ؤ': 'o',                    // often "u" or "v" — "o" is the common namesake vowel
  'ه': 'h', 'ة': 'h',
  'ي': 'i', 'ى': 'i', 'ی': 'i', 'ئ': 'i',
  // digits
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

// diacritics (fathа, kasra, damma, shadda, sukun, tanwin) — strip before mapping.
const DIACRITICS = /[ً-ْٰ]/g;

export function transliterate(s) {
  if (!s) return '';
  const stripped = s.replace(DIACRITICS, '');
  let out = '';
  for (const ch of stripped) {
    out += MAP[ch] ?? ch;
  }
  // collapse whitespace
  return out.replace(/\s+/g, ' ').trim();
}
