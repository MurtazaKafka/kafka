// bayer 8x8 ordered dither — ported from the prototype.
// the one piece of the old aesthetic vocabulary that carries over.

const BAYER_8X8 = [
  [ 0, 32,  8, 40,  2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44,  4, 36, 14, 46,  6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [ 3, 35, 11, 43,  1, 33,  9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47,  7, 39, 13, 45,  5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

// parses "#RRGGBB" → { r, g, b }.
function hexToRgb(hex) {
  const m = hex.replace('#', '');
  return {
    r: parseInt(m.slice(0, 2), 16),
    g: parseInt(m.slice(2, 4), 16),
    b: parseInt(m.slice(4, 6), 16),
  };
}

// dithers an ImageData in place to 1-bit (transparent or `inkHex`).
// uses luminance + bayer 8x8 threshold map.
export function applyDithering(imageData, inkHex = '#171613') {
  const { data, width, height } = imageData;
  const ink = hexToRgb(inkHex);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      // bt.709 luma
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      const t = (BAYER_8X8[y & 7][x & 7] + 0.5) * (255 / 64);

      if (lum < t) {
        data[i]     = ink.r;
        data[i + 1] = ink.g;
        data[i + 2] = ink.b;
        data[i + 3] = 255;
      } else {
        data[i + 3] = 0;
      }
    }
  }
  return imageData;
}

// loads a url, draws at targetWidth × targetHeight, dithers, returns a canvas.
// cached by (url|w|h|ink).
const cache = new Map();

export async function ditherUrl(url, width, height, inkHex = '#171613') {
  const key = `${url}|${width}|${height}|${inkHex}`;
  if (cache.has(key)) return cache.get(key);

  const p = (async () => {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // fit image within canvas, preserving aspect, centered.
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = width / height;
    let dw, dh;
    if (ir > cr) { dw = width; dh = width / ir; }
    else         { dh = height; dw = height * ir; }
    ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);

    const data = ctx.getImageData(0, 0, width, height);
    applyDithering(data, inkHex);
    ctx.putImageData(data, 0, 0);
    return canvas.toDataURL('image/png');
  })().catch(() => null);

  cache.set(key, p);
  return p;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
