/**
 * Cross-context message contracts (background, content, side panel).
 * When adding a new message type, document it here and in CONTRIBUTING.md.
 */

import type { ParagraphCoverage } from "../lib/types.js";

export type GetJdRequest = { type: "GET_JD_FROM_TAB" };
export type GetJdResponse =
  | { ok: true; text: string; source: "linkedin" | "unknown" }
  | { ok: false; error: string };

export type Ping = { type: "PING" };

/** Side panel → background → offscreen */
export type SemanticAnalyzeRequest = {
  type: "SEMANTIC_ANALYZE";
  jd: string;
  resume: string;
};

export type SemanticAnalyzeResponse =
  | {
      ok: true;
      coverage: number;
      weakParagraphs: ParagraphCoverage[];
      modelId: string;
    }
  | { ok: false; error: string };

/** Background → offscreen only */
export type OffscreenAnalyzeRequest = {
  type: "OFFSCREEN_ANALYZE";
  jd: string;
  resume: string;
};

export type OffscreenAnalyzeResponse = SemanticAnalyzeResponse;
