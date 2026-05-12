import { useEffect, useState } from 'react';
import { ditherUrl } from '../lib/dither.js';

export default function DitheredImage({ src, width = 64, height = 96, alt = '' }) {
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    let live = true;
    if (!src) { setDataUrl(null); return; }
    ditherUrl(src, width, height).then((d) => { if (live) setDataUrl(d); });
    return () => { live = false; };
  }, [src, width, height]);

  if (!src || !dataUrl) {
    return (
      <div
        aria-hidden
        style={{
          width,
          height,
          border: '1px solid var(--hairline)',
          background: 'transparent',
        }}
      />
    );
  }

  return (
    <img
      src={dataUrl}
      width={width}
      height={height}
      alt={alt}
      style={{ display: 'block', imageRendering: 'pixelated' }}
    />
  );
}
