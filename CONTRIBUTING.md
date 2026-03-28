# Contributing to AlignLocal

Thanks for helping. This project is intentionally small and welcoming to first-time extension contributors.

## Ground rules

- **Be kind** in issues and PRs.
- **No false claims**: do not UI-copy that implies hiring probability, ATS guarantees, or “AI recruiter” authority.
- **Privacy-first**: avoid adding analytics or sending resume/JD text to your servers without explicit user opt-in and documentation.

## How to contribute

### Report bugs

Open an issue with:

- Chrome version
- Steps to reproduce
- What you expected vs what happened
- For LinkedIn: URL pattern (no private data) and **screenshot of the job description area** if extraction failed

### Improve LinkedIn JD extraction

LinkedIn’s markup changes. To fix `src/content/linkedin.ts`:

1. Reproduce on a job detail page.
2. Inspect the DOM for a stable container around the description.
3. Add a selector to `SELECTORS` **at the top** of the list (most specific first).
4. Keep `collectVisibleText` so we don’t pull nav chrome.

Add a short note in your PR about which page type you tested (e.g. logged-in job view).

### Add a new job site

For v1 we prefer **generic paste** over fragile scrapers. If you add a site-specific content script:

- Put logic in `src/content/<site>.ts`.
- Register it in `src/manifest.json` with **minimal** `host_permissions`.
- Document test URLs and failure modes in the PR.

### ONNX / WASM semantic mode (roadmap)

Planned architecture:

- **Offscreen document** loads **ONNX Runtime Web** and a **small embedding model**.
- Side panel sends chunks; offscreen returns embeddings; side panel computes cosine similarity.

If you pick this up, open a **draft PR early** with model name, size, license, and cold/warm timings on one reference laptop.

### Code style

- `npm run check` and `npm run lint` should pass.
- Prefer **small PRs** with a clear description.
- Use **type-only imports** where possible (`import type { ... }`).

## Local setup

See [README.md](README.md) for `npm install` and loading `dist/` unpacked.

## Maintainer note

When you fork or publish the canonical repo, update:

- README “GitHub” link in `src/sidepanel/index.html`
- This file’s examples and any store URLs
