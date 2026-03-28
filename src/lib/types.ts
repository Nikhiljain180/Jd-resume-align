export type ResumeProfile = {
  id: string;
  name: string;
  text: string;
  updatedAt: number;
};

export type AnalysisMode = "lite_tfidf" | "semantic_embedding";

export type GapTerm = {
  term: string;
  weight: number;
};

export type ParagraphCoverage = {
  excerpt: string;
  /** 0–1 higher means better alignment with resume for this JD excerpt */
  score: number;
};

export type AnalysisResult = {
  mode: AnalysisMode;
  /** 0–1 coverage of JD vs resume (method depends on mode) */
  coverage: number;
  missingTerms: GapTerm[];
  weakParagraphs: ParagraphCoverage[];
  disclaimer: string;
};

/** @deprecated use AnalysisResult */
export type LiteAnalysisResult = AnalysisResult;
