import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const svg = readFileSync(resolve(root, 'public/icon.svg'));

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable-512.png', size: 512, padding: 0.1 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32.png', size: 32 }
];

for (const { name, size, padding } of sizes) {
  // For maskable, wrap the SVG in extra padding so it survives mask cropping.
  let input = svg;
  if (padding) {
    const inner = svg.toString().replace('<svg', '<svg width="100%" height="100%"');
    const pad = Math.round(size * padding);
    const wrapped = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="100%" height="100%" fill="#0f766e"/>
      <g transform="translate(${pad}, ${pad})">
        <svg width="${size - pad * 2}" height="${size - pad * 2}" viewBox="0 0 512 512">${inner.replace(/^[\s\S]*?<svg[^>]*>/, '').replace('</svg>', '')}</svg>
      </g>
    </svg>`;
    input = Buffer.from(wrapped);
  }
  const resvg = new Resvg(input, { fitTo: { mode: 'width', value: size } });
  const png = resvg.render().asPng();
  const outPath = resolve(root, 'public', name);
  writeFileSync(outPath, png);
  console.log(`wrote ${name} (${png.byteLength} bytes)`);
}

// Open Graph image: 1200x630 with logo + tagline.
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#134e4a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g transform="translate(440, 165) scale(0.625)">
    <rect width="512" height="512" rx="96" fill="#fafaf9"/>
    <g transform="translate(256 256)" fill="none" stroke="#0f766e" stroke-width="28" stroke-linecap="round" stroke-linejoin="round">
      <path d="M -110 60 L -50 120 L 110 -80"/>
      <circle cx="80" cy="-110" r="14" fill="#0f766e" stroke="none"/>
      <circle cx="-130" cy="-100" r="10" fill="#0f766e" stroke="none"/>
      <circle cx="130" cy="80" r="10" fill="#0f766e" stroke="none"/>
    </g>
  </g>
  <text x="600" y="520" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="56" font-weight="800" fill="#fafaf9" text-anchor="middle">Tidyup</text>
  <text x="600" y="575" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="28" fill="#ccfbf1" text-anchor="middle">Snap a photo. We sell it for you.</text>
</svg>`;
const ogResvg = new Resvg(Buffer.from(ogSvg), { fitTo: { mode: 'width', value: 1200 } });
writeFileSync(resolve(root, 'public/og-image.png'), ogResvg.render().asPng());
console.log('wrote og-image.png');
