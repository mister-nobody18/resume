// Regenerates public/cv-cristian-soricu.pdf from the real page markup, so
// the static fallback download never drifts from the live HTML/CSS.
//
// The PDF is built from a separate "pdf-source" build (CV_INCLUDE_PHONE=true)
// so the phone number is included in the download, even though it is
// omitted from the live, indexable HTML. See README.md "Privacy" section.
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { createReadStream, existsSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, extname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const pdfSourceDir = join(root, "dist-pdf-source");
const outFile = join(root, "public", "cv-cristian-soricu.pdf");

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

console.log("Building pdf-source variant (phone included)...");
execSync("npx astro build --outDir dist-pdf-source", {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, CV_INCLUDE_PHONE: "true" },
});

const entry = join(pdfSourceDir, "index.html");
if (!existsSync(entry)) {
  throw new Error(`Expected build output at ${entry}`);
}

// Serve over HTTP (not file://) so root-absolute asset paths resolve.
const server = createServer((req, res) => {
  const urlPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const filePath = join(pdfSourceDir, decodeURIComponent(urlPath));
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader("Content-Type", MIME[extname(filePath)] || "application/octet-stream");
  createReadStream(filePath).pipe(res);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();

console.log("Rendering PDF with Playwright...");
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
await page.emulateMedia({ media: "print" });
await page.pdf({
  path: outFile,
  format: "A4",
  margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
  printBackground: true,
  displayHeaderFooter: false,
});
await browser.close();
server.close();

rmSync(pdfSourceDir, { recursive: true, force: true });

console.log(`Wrote ${outFile}`);
console.log("Run `npm run build` again so the refreshed PDF is copied into dist/.");
