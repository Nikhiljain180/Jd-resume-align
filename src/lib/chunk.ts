/** Split job descriptions into meaningful paragraphs for scoring. */
export function jdParagraphs(jd: string): string[] {
  return jd
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 40);
}

/** Split resume into paragraphs / blocks for embedding. */
export function resumeChunks(resume: string): string[] {
  const parts = resume
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 15);
  if (parts.length > 0) return parts;
  const trimmed = resume.trim();
  return trimmed.length > 0 ? [trimmed] : [];
}
