# AlignLocal (jd-resume-align)

Chrome extension (Manifest V3) that estimates **how much of a job posting’s emphasis** is reflected in **your resume text**—**on your device**.  
**v0.1** ships **lite TF‑IDF overlap** in the side panel; **local ONNX sentence embeddings** (WASM / Offscreen) are the planned next step.

## Important

- This is **not** a prediction of interviews, ATS outcomes, or hiring.
- **Lite mode** only measures **word / emphasis overlap**, not true semantics.
- Resume text and job descriptions stay in **IndexedDB** in your browser unless you copy them elsewhere.

## Develop

Requirements: **Node 20+**.

```bash
cd jd-resume-align
npm install
npm run build
```

Then in Chrome: **Extensions → Developer mode → Load unpacked →** choose the `dist/` folder.

### Scripts

| Command        | Purpose                 |
| -------------- | ----------------------- |
| `npm run build` | Production bundle to `dist/` |
| `npm run dev`   | `vite build --watch`    |
| `npm run check` | Typecheck               |
| `npm run lint`  | ESLint                  |

## Use

1. Open the extension **side panel** (toolbar icon).
2. Paste or **Save** a resume version.
3. Open a **LinkedIn job posting** and click **Load from LinkedIn tab**, or paste the JD manually.
4. **Analyze coverage** and read gaps / weak sections.

If LinkedIn changes their DOM, extraction may fail—paste the JD manually or help update selectors ([CONTRIBUTING.md](CONTRIBUTING.md)).

## Repo hygiene for open source

- Replace the placeholder GitHub link in the side panel header once you publish the real repository URL.
- Add a `SECURITY.md` if you accept reports.
- Chrome Web Store listing will need a privacy policy describing local-only processing.

## License

MIT — see [LICENSE](LICENSE). Third-party model weights (when ONNX lands) will need **separate license attribution**.
