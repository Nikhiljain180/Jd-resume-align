# AlignLocal (jd-resume-align)

Chrome extension (Manifest V3) that estimates **how much of a job posting’s emphasis** is reflected in **your resume text**—**on your device**.

- **Lite mode:** fast TF‑IDF / keyword emphasis in the side panel (no model download).
- **Semantic mode:** local sentence embeddings via **`@xenova/transformers`** (ONNX Runtime Web / WASM) in an **offscreen document**, default model **`Xenova/all-MiniLM-L6-v2`**. The first run **downloads** weights from **Hugging Face / jsDelivr** and caches them in the browser.

## Important

- This is **not** a prediction of interviews, ATS outcomes, or hiring.
- **Lite mode** is overlap of wording, not true semantics.
- **Semantic mode** measures cosine similarity of embeddings between JD sections and resume blocks; it is still an imperfect proxy for recruiter judgment.
- Resume text is stored in **IndexedDB** in your browser. Semantic mode needs **network permission** only to **fetch the model** (and Hugging Face CDN), not to send your resume to us.

## Permissions (why)

| Permission / host           | Purpose                                                  |
| --------------------------- | -------------------------------------------------------- |
| `storage`, `sidePanel`, …   | UI, settings, LinkedIn script messaging                  |
| `offscreen`                 | Heavy WASM inference outside the service worker        |
| `linkedin.com`              | Read job description on the page                         |
| `huggingface.co`, `cdn.jsdelivr.net` | Download & cache embedding model files      |

## Develop

Requirements: **Node 20+**. `npm install` may pull **sharp** as an optional dependency of `@xenova/transformers` (used in Node tooling); the **extension runtime** does not require it.

```bash
cd jd-resume-align
npm install
npm run build
```

Chrome: **Extensions → Developer mode → Load unpacked →** select the **`dist/`** folder.

### Scripts

| Command         | Purpose                      |
| --------------- | ---------------------------- |
| `npm run build` | Production bundle to `dist/` |
| `npm run dev`   | `vite build --watch`         |
| `npm run check` | Typecheck                    |
| `npm run lint`  | ESLint                       |

## Use

1. Open the **side panel** (toolbar icon).
2. Choose **Lite** or **Semantic**.
3. Paste or **Save** a resume version.
4. On a **LinkedIn job**, click **Load from LinkedIn tab**, or paste the JD.
5. **Analyze coverage**.

If LinkedIn breaks extraction, paste the JD manually or update selectors ([CONTRIBUTING.md](CONTRIBUTING.md)).

## Model & third-party

- Embeddings: **[Xenova/all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2)** (ONNX export; see model card for license — typically Apache-2.0).
- Inference: **onnxruntime-web** (bundled via transformers.js).

## License

MIT — see [LICENSE](LICENSE). Model weights and upstream checkpoints are **not** MIT; cite the model card in distributions.
