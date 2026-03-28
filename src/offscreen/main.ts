/**
 * Offscreen document: loads @xenova/transformers (ONNX/WASM) for sentence embeddings.
 * Keep heavy work here so the service worker stays responsive.
 */

import { env, pipeline } from "@xenova/transformers";
import { jdParagraphs, resumeChunks } from "../lib/chunk.js";
import type { OffscreenAnalyzeRequest, OffscreenAnalyzeResponse } from "../messaging/protocol.js";
import type { ParagraphCoverage } from "../lib/types.js";

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

env.allowLocalModels = false;
env.useBrowserCache = true;

type Extractor = Awaited<ReturnType<typeof pipeline>>;
let extractorPromise: Promise<Extractor> | null = null;

function getExtractor(): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", MODEL_ID) as Promise<Extractor>;
  }
  return extractorPromise;
}

function tensorToVector(out: unknown): Float32Array {
  if (!out || typeof out !== "object") {
    throw new Error("Unexpected embedding output");
  }
  const o = out as { data?: Float32Array; dims?: readonly number[] };
  if (!o.data) {
    throw new Error("Embedding tensor missing data");
  }
  const data = o.data;
  const dims = o.dims ?? [];
  if (dims.length === 1) {
    return data.slice();
  }
  if (dims.length >= 2) {
    const cols = dims[1] ?? Math.floor(data.length / (dims[0] ?? 1));
    return data.slice(0, cols);
  }
  return data.slice();
}

async function embedTexts(model: Extractor, texts: string[]): Promise<Float32Array[]> {
  const vectors: Float32Array[] = [];
  for (const text of texts) {
    const out = await model(text, { pooling: "mean", normalize: true } as never);
    vectors.push(tensorToVector(out));
  }
  return vectors;
}

function cosineSim(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) dot += a[i] * b[i];
  return dot;
}

async function analyze(jd: string, resume: string): Promise<OffscreenAnalyzeResponse> {
  const jdParts = jdParagraphs(jd);
  const jdSegs = jdParts.length > 0 ? jdParts : jd.trim().length > 0 ? [jd.trim()] : [];
  const resSegs = resumeChunks(resume);

  if (jdSegs.length === 0) {
    return { ok: false, error: "Job description is empty after chunking." };
  }
  if (resSegs.length === 0) {
    return { ok: false, error: "Resume is empty after chunking." };
  }

  const model = await getExtractor();
  const [jdEmb, resEmb] = await Promise.all([
    embedTexts(model, jdSegs),
    embedTexts(model, resSegs),
  ]);

  const weakParagraphs: ParagraphCoverage[] = jdSegs.map((excerpt, i) => {
    const v = jdEmb[i];
    let best = 0;
    for (const r of resEmb) {
      const s = cosineSim(v, r);
      if (s > best) best = s;
    }
    return {
      excerpt: excerpt.slice(0, 200).replace(/\s+/g, " "),
      score: best,
    };
  });

  weakParagraphs.sort((a, b) => a.score - b.score);

  const coverage =
    weakParagraphs.length > 0
      ? weakParagraphs.reduce((acc, p) => acc + p.score, 0) / weakParagraphs.length
      : 0;

  return {
    ok: true,
    coverage: Math.max(0, Math.min(1, coverage)),
    weakParagraphs: weakParagraphs.slice(0, 8),
    modelId: MODEL_ID,
  };
}

const REQ: OffscreenAnalyzeRequest["type"] = "OFFSCREEN_ANALYZE";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== REQ) return undefined;
  const { jd, resume } = message as OffscreenAnalyzeRequest;
  void analyze(jd, resume).then(sendResponse);
  return true;
});
