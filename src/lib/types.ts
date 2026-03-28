export type ResumeProfile = {
  id: string;
  name: string;
  text: string;
  updatedAt: number;
};

export type AnalysisMode = "lite_tfidf";

export type GapTerm = {
  term: string;
  weight: number;
};

export type ParagraphCoverage = {
  excerpt: string;
  score: number;
};

export type LiteAnalysisResult = {
  mode: AnalysisMode;
  /** 0–1 estimated coverage of JD emphasis by resume tokens */
  coverage: number;
  missingTerms: GapTerm[];
  weakParagraphs: ParagraphCoverage[];
  disclaimer: string;
};
