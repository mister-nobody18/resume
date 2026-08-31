# resume.soricu.com — CV

Live at **[resume.soricu.com](https://resume.soricu.com)**.

A single-page, printable CV. Static HTML/CSS/JS (via Astro at build time
only — zero client-side framework, zero third-party runtime dependencies).
Works fully with JavaScript disabled; JS only adds the theme toggle and the
print-button convenience.

## Running it

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs static files to dist/
npm run preview  # serve the dist/ build locally
```

`dist/` is what you deploy — plain files, no server required.

## Editing content

All CV content lives in one place: [`data/cv.json`](data/cv.json). Edit
names, dates, descriptions, skills, etc. there — the page template
(`src/pages/index.astro`) reads from it, so you never need to touch layout
or CSS to update content.

Anything still unresolved from the original CV is marked with a `*Todo`
field next to the relevant entry in that file, and summarized in
[`TODO.md`](TODO.md).

To add a new skill category or entry, add it under `skills.categories` —
no code changes needed. Same for experience, education, certificates,
languages, and interests: each is an array the template maps over.

## Design system

Colors are defined once as CSS custom properties in
`public/styles/tokens.css` (light palette in `:root`, a separately
designed dark palette under `prefers-color-scheme: dark` / `[data-theme]`).
Every other stylesheet references these tokens — no bare hex values
elsewhere. Typefaces are self-hosted, subset to latin + latin-ext (Romanian
diacritics) WOFF2 files in `public/fonts/`.

## Regenerating the PDF

The "Download PDF" button is a plain link with a `download` attribute — it
downloads `public/cv-cristian-soricu.pdf` directly, no print dialog, and
works even with JavaScript disabled. Regenerate that file whenever content
changes:

```sh
npm run pdf
npm run build   # so the refreshed PDF is copied into dist/
```

`scripts/generate-pdf.mjs` builds a second, ephemeral copy of the site with
`CV_INCLUDE_PHONE=true` (see Privacy below), serves it over a local HTTP
server, and uses Playwright's `page.pdf()` to render it — headless Chromium
printing the actual page, not a screenshot-to-image tool. That temporary
build is deleted afterward; only the resulting PDF is kept.

### Print settings note

When checking print output manually in Chrome (File → Print, or the print
button), set **scale to 100%** and turn **"Headers and footers" off** —
otherwise Chrome's own header/footer text will appear on the page in
addition to the site's content. `@page { size: A4; margin: 12mm }` in
`print.css` assumes those defaults.

## Privacy

Per your call, the site defaults to the privacy-preserving option on every
axis:

- **Address:** city only ("Bucharest, Romania") is published anywhere on
  the site. The full street address from the source CV never appears in
  the HTML.
- **Phone:** omitted from the live HTML entirely (not in the DOM, so
  ordinary scrapers can't find it) but included in the pre-rendered PDF —
  downloading it signals real interest, unlike an anonymous page crawl.
- **Email:** plain `mailto:` links. Both addresses are on a domain you
  control, and a plain link is far more usable (click-to-email, works in
  every mail client, screen-reader friendly) than a JS-obfuscated one —
  which would also break the "must work without JavaScript" requirement.

## Deploying to resume.soricu.com (DirectAdmin / shared hosting)

This host is Apache/LiteSpeed behind DirectAdmin, not Netlify/Cloudflare
Pages — deploy is a plain file upload into the domain's `public_html`:

1. `npm run build` locally — produces `dist/`.
2. In DirectAdmin's File Manager, go to
   `domains/resume.soricu.com/public_html`.
3. Upload the **contents** of `dist/` there (not the `dist` folder itself —
   `index.html` needs to sit directly in `public_html`), using File
   Manager's multi-file/folder upload. Zip-and-extract is **not**
   reliable on this host — confirmed here: `.well-known/security.txt`
   came through fine on an extract, but `.htaccess` came out
   empty/garbled. Upload files directly instead of going through a zip.
4. Toggle "Show hidden files" in File Manager and confirm `.htaccess`
   actually made it into `public_html` and matches `public/.htaccess` in
   this repo (open it in the File Manager editor and compare, or just
   overwrite it directly from that file's content) — don't rely on any
   extractor for this one file.
5. Visit `https://resume.soricu.com/` and check DevTools → Network → the
   document response has the `Content-Security-Policy` header (confirms
   `.htaccess` is being read — LiteSpeed honors Apache's `mod_headers`
   directives the same way). Use **Disable cache** + a hard reload, since a
   304 response may not show the full header set.

(`public/_headers` is Netlify/Cloudflare Pages-only and is ignored by this
host; `public/.htaccess` is the equivalent for Apache/LiteSpeed and is what
actually applies here. `nginx.conf` is kept only as a portable reference for
if this ever moves to a host running nginx.)

## Security

- `public/.htaccess` — CSP and security headers for Apache/LiteSpeed
  (DirectAdmin) — this is the one that actually applies on
  resume.soricu.com.
- `public/_headers` — the same headers in Netlify/Cloudflare Pages' format,
  kept in case this ever moves there.
- `nginx.conf` — the same headers as a portable nginx snippet.
- The CSP's `script-src` allows only `'self'` plus a `sha256-...` hash for
  the single inline theme-init script in `src/pages/index.astro` (needed to
  set the theme before first paint, avoiding a flash of the wrong theme).
  **If you ever edit that inline script**, its hash changes — rebuild, then
  recompute the hash and update it in `public/.htaccess`, `public/_headers`,
  and `nginx.conf`:

  ```js
  const crypto = require("crypto");
  // paste the exact script body (between <script> and </script> in dist/index.html)
  console.log("sha256-" + crypto.createHash("sha256").update(scriptBody, "utf8").digest("base64"));
  ```

## Regenerating icons / OG image

`public/favicon.ico`, `public/apple-touch-icon.png`, and `public/og-image.png`
are generated from the initials mark via Playwright:

```sh
npm run icons
```
