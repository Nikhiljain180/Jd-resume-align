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

### Semantic (embeddings) mode

Implemented in `src/offscreen/main.ts` via **`@xenova/transformers`**. The background worker ensures a single offscreen document (`chrome.offscreen`) and relays `OFFSCREEN_ANALYZE` messages.

Contributions welcome:

- **Model choice:** smaller / multilingual checkpoints (document size & license).
- **Batching** embeddings for fewer round-trips (watch memory on long JDs).
- **Store review:** onnxruntime-web bundles may use `eval`; call out mitigations or alternatives if you know them.

Open a **draft PR early** with cold/warm timings on a reference laptop if you change the model stack.

### Code style

- `npm run check` and `npm run lint` should pass.
- Prefer **small PRs** with a clear description.
- Use **type-only imports** where possible (`import type { ... }`).

## Local setup

See [README.md](README.md) for `npm install` and loading `dist/` unpacked.

## Maintainer note

When you publish a fork, update links in the side panel header and this file if your origin changes.
