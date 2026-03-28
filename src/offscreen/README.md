# Offscreen document (planned)

Manifest V3 service workers are poor hosts for heavy WASM. The ONNX Runtime Web path should live in an **offscreen document** loaded by the background worker.

When implemented:

- Add `offscreen` permission to `src/manifest.json`.
- Bundle `src/offscreen/main.ts` + HTML entry via Vite.
- Background creates the offscreen document once per session and forwards embed jobs with cancellation support.

Until then, **lite analysis** runs entirely in the side panel.
