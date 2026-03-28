import type { AnalysisResult, GapTerm, ParagraphCoverage } from "./types.js";
import { jdParagraphs } from "./chunk.js";

const STOP = new Set(
  "a an the and or but if in on with for to of at by from as is was are were be been being it this that these those you your we our they their not no yes so than then into over out up down about all any some more most other can will just do does did done such".split(
    " ",
  ),
);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[-.]+|[-.]+$/g, ""))
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function termFreq(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) {
    m.set(t, (m.get(t) ?? 0) + 1);
  }
  return m;
}

/**
 * Lite TF‑IDF style coverage: weights JD terms by how characteristic they are of the posting,
 * measures how much of that weight is reflected in the resume wording (set intersection).
 * This is not semantic similarity; ONNX embeddings will improve that in a follow-up.
 */
export function analyzeLite(jd: string, resume: string): AnalysisResult {
  const jdTok = tokenize(jd);
  const resumeTok = tokenize(resume);
  const resumeSet = new Set(resumeTok);

  const df = new Map<string, number>();
  const paras = jdParagraphs(jd);
  const docs = paras.length > 0 ? paras : [jd];
  for (const doc of docs) {
    const unique = new Set(tokenize(doc));
    for (const t of unique) {
      df.set(t, (df.get(t) ?? 0) + 1);
    }
  }
  const N = Math.max(1, docs.length);

  const jdTf = termFreq(jdTok);
  let jdWeighted = 0;
  let matchedWeighted = 0;
  const missing: GapTerm[] = [];

  for (const [term, tf] of jdTf) {
    const idf = Math.log(1 + N / (1 + (df.get(term) ?? 0)));
    const w = tf * idf;
    jdWeighted += w;
    if (resumeSet.has(term)) {
      matchedWeighted += w;
    } else {
      missing.push({ term, weight: w });
    }
  }

  missing.sort((a, b) => b.weight - a.weight);

  const weakParagraphs: ParagraphCoverage[] = paras.map((p) => {
    const pt = tokenize(p);
    if (pt.length === 0) return { excerpt: p.slice(0, 120), score: 1 };
    let num = 0;
    for (const t of pt) {
      if (resumeSet.has(t)) num += 1;
    }
    return { excerpt: p.slice(0, 180).replace(/\s+/g, " "), score: num / pt.length };
  });
  weakParagraphs.sort((a, b) => a.score - b.score);

  const coverage = jdWeighted > 0 ? Math.min(1, matchedWeighted / jdWeighted) : 0;

  return {
    mode: "lite_tfidf",
    coverage,
    missingTerms: missing.slice(0, 12),
    weakParagraphs: weakParagraphs.slice(0, 6),
    disclaimer:
      "Lite mode scores keyword / emphasis overlap only—it does not predict interview or shortlist odds. Use Semantic mode for local transformer embeddings.",
  };
}
