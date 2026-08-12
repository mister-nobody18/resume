# TODO

Most of the placeholder content from the original 5-year-old CV has since
been replaced with real, current information (title, profile, experience,
education, language levels, LinkedIn, headshot). What's left:

- **Romanian version.** `<html lang="en">` — no Romanian translation yet.
  If you want one, it needs its own route/page and an `hreflang` pair.
- **ITIL v4 Foundation certificate.** Added without an expiration date, per
  your call — it's valid for 3 years from the 2025 issue date, but that
  detail isn't shown on the page. If you'd rather show validity without a
  hard expiry (e.g. "valid through 2028"), that's a one-line change to the
  `issued` field's rendering in `src/pages/index.astro`.
- **Skills.** Python, REST APIs, and the AI-assisted development tools
  (Claude Code, GitHub Copilot) are in now. Keep adding anything else
  under `skills.categories` in `data/cv.json` as it comes up — no layout
  or CSS changes needed.
- **Phone number.** Per your earlier decision, still omitted from the live
  HTML and included only in the pre-rendered PDF
  (`public/cv-cristian-soricu.pdf`, regenerated via `npm run pdf`).
- **Address.** Public site shows "Bucharest, Romania" only, by design.
