// Generates favicon.ico, apple-touch-icon.png and og-image.png from the
// blue-palette initials mark, using Playwright to rasterize inline SVG.
// Run with: node scripts/gen-icons.mjs
import { chromium } from "playwright";
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

async function renderPng(browser, svg, size) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<html><body style="margin:0">${svg}</body></html>`
  );
  const buf = await page.locator("svg").screenshot({ omitBackground: false });
  await page.close();
  return buf;
}

function pngToIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries = [];
  const images = [];
  for (const png of pngBuffers) {
    const size = png.__size >= 256 ? 0 : png.__size;
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    images.push(png);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...images]);
}

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0b1f3a" />
  <text x="16" y="22" font-family="Georgia, serif" font-size="16" font-weight="600" fill="#dce9f7" text-anchor="middle">CS</text>
</svg>`;

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1f3a" />
      <stop offset="1" stop-color="#1e5aa8" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)" />
  <text x="80" y="330" font-family="Georgia, serif" font-size="96" font-weight="600" fill="#fbfcfe">Cristian Soricu</text>
  <text x="80" y="400" font-family="Georgia, serif" font-size="40" fill="#dce9f7">Software Engineer — CV</text>
  <rect x="80" y="460" width="120" height="6" fill="#dce9f7" />
</svg>`;

const browser = await chromium.launch();

const png16 = await renderPng(browser, iconSvg, 16);
png16.__size = 16;
const png32 = await renderPng(browser, iconSvg, 32);
png32.__size = 32;
const png180 = await renderPng(browser, iconSvg, 180);

// og image needs its own viewport (not square) — render separately
const ogPage = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await ogPage.setContent(`<html><body style="margin:0">${ogSvg}</body></html>`);
const ogBuf = await ogPage.locator("svg").screenshot();
await ogPage.close();

await browser.close();

// Playwright's screenshot() writes uncompressed-ish PNGs. These are flat
// colors + text, ideal candidates for palette quantization — re-encoding
// through sharp cuts og-image.png from ~320KB to a fraction of that with
// no visible quality loss.
const png180Optimized = await sharp(png180).png({ compressionLevel: 9, palette: true }).toBuffer();
const ogBufOptimized = await sharp(ogBuf).png({ compressionLevel: 9, palette: true }).toBuffer();

await writeFile(join(publicDir, "favicon.ico"), pngToIco([png16, png32]));
await writeFile(join(publicDir, "apple-touch-icon.png"), png180Optimized);
await writeFile(join(publicDir, "og-image.png"), ogBufOptimized);

console.log("Generated favicon.ico, apple-touch-icon.png, og-image.png");
