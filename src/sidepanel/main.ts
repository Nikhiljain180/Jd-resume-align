import { analyzeLite } from "../lib/analyze-lite.js";
import { deleteResume, listResumes, saveResume } from "../lib/storage.js";
import type { AnalysisMode, GapTerm, ParagraphCoverage } from "../lib/types.js";

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T | null;

const resumeName = $("#resumeName") as HTMLInputElement;
const resumeBody = $("#resumeBody") as HTMLTextAreaElement;
const resumeSelect = $("#resumeSelect") as HTMLSelectElement;
const jdBody = $("#jdBody") as HTMLTextAreaElement;

const btnSaveResume = $("#btnSaveResume") as HTMLButtonElement;
const btnDeleteResume = $("#btnDeleteResume") as HTMLButtonElement;
const btnPullLinkedIn = $("#btnPullLinkedIn") as HTMLButtonElement;
const btnClearJd = $("#btnClearJd") as HTMLButtonElement;
const btnAnalyze = $("#btnAnalyze") as HTMLButtonElement;

const results = $("#results") as HTMLElement;
const scorePct = $("#scorePct") as HTMLElement;
const scoreCaption = $("#scoreCaption") as HTMLElement;
const disclaimer = $("#disclaimer") as HTMLElement;
const missingTerms = $("#missingTerms") as HTMLUListElement;
const weakParas = $("#weakParas") as HTMLUListElement;
const weakHeading = $("#weakHeading") as HTMLHeadingElement;
const errorEl = $("#error") as HTMLElement;
const scoreRing = $("#scoreRing") as HTMLElement;
const modeBadge = $("#modeBadge") as HTMLElement;
const analyzeHint = $("#analyzeHint") as HTMLElement;

function selectedMode(): "lite" | "semantic" {
  const r = document.querySelector('input[name="mode"]:checked') as HTMLInputElement | null;
  return r?.value === "semantic" ? "semantic" : "lite";
}

function showError(msg: string) {
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
}

function clearError() {
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

function setRing(coverage: number) {
  const pct = Math.round(coverage * 100);
  scorePct.textContent = `${pct}%`;
  const hue = Math.round(120 * coverage);
  scoreRing.style.borderColor = `hsl(${hue} 50% 45%)`;
}

async function refreshResumeList(selectedId?: string) {
  const list = await listResumes();
  resumeSelect.innerHTML = "";
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = list.length ? "Load saved…" : "No saved versions";
  resumeSelect.append(ph);
  for (const r of list) {
    const o = document.createElement("option");
    o.value = r.id;
    o.textContent = `${r.name} · ${new Date(r.updatedAt).toLocaleDateString()}`;
    resumeSelect.append(o);
  }
  if (selectedId) {
    resumeSelect.value = selectedId;
  }
}

resumeSelect.addEventListener("change", async () => {
  clearError();
  const id = resumeSelect.value;
  if (!id) return;
  const list = await listResumes();
  const r = list.find((x) => x.id === id);
  if (r) {
    resumeName.value = r.name;
    resumeBody.value = r.text;
  }
});

btnSaveResume.addEventListener("click", async () => {
  clearError();
  try {
    const name = resumeName.value;
    const text = resumeBody.value.trim();
    if (!text) {
      showError("Paste resume text before saving.");
      return;
    }
    const existingId = resumeSelect.value || undefined;
    const saved = await saveResume(name, text, existingId);
    await refreshResumeList(saved.id);
    resumeSelect.value = saved.id;
  } catch (e) {
    showError(e instanceof Error ? e.message : "Could not save resume.");
  }
});

btnDeleteResume.addEventListener("click", async () => {
  clearError();
  const id = resumeSelect.value;
  if (!id) return;
  try {
    await deleteResume(id);
    resumeName.value = "";
    resumeBody.value = "";
    await refreshResumeList();
  } catch (e) {
    showError(e instanceof Error ? e.message : "Could not delete.");
  }
});

btnPullLinkedIn.addEventListener("click", async () => {
  clearError();
  try {
    const res = await chrome.runtime.sendMessage({ type: "GET_JD_FROM_TAB" });
    if (res?.ok) {
      jdBody.value = res.text as string;
    } else {
      showError(res?.error ?? "Could not load JD from tab.");
    }
  } catch (e) {
    showError(e instanceof Error ? e.message : "Message to background failed.");
  }
});

btnClearJd.addEventListener("click", () => {
  jdBody.value = "";
  clearError();
});

document.querySelectorAll('input[name="mode"]').forEach((el) => {
  el.addEventListener("change", () => {
    const m = selectedMode();
    modeBadge.textContent = m === "semantic" ? "Mode: semantic (local model)" : "Mode: lite";
    analyzeHint.textContent =
      m === "semantic"
        ? "First semantic run may take a minute while the model downloads and caches."
        : "";
  });
});

btnAnalyze.addEventListener("click", async () => {
  clearError();
  const jd = jdBody.value.trim();
  const resume = resumeBody.value.trim();
  if (!jd) {
    showError("Add a job description first.");
    return;
  }
  if (!resume) {
    showError("Add or load a resume first.");
    return;
  }

  const mode = selectedMode();
  const lite = analyzeLite(jd, resume);

  if (mode === "lite") {
    renderResults(lite, "lite");
    return;
  }

  btnAnalyze.disabled = true;
  btnAnalyze.textContent = "Running semantic analysis…";
  try {
    const sem = await chrome.runtime.sendMessage({
      type: "SEMANTIC_ANALYZE",
      jd,
      resume,
    });
    if (!sem?.ok) {
      showError(sem?.error ?? "Semantic analysis failed.");
      return;
    }
    const merged = {
      mode: "semantic_embedding" as const,
      coverage: sem.coverage as number,
      missingTerms: lite.missingTerms,
      weakParagraphs: sem.weakParagraphs,
      disclaimer: `Semantic coverage uses ${sem.modelId} embeddings (mean max‑cosine per JD section). Cached after first download. This is still not a hiring prediction.`,
    };
    renderResults(merged, "semantic");
  } catch (e) {
    showError(e instanceof Error ? e.message : "Semantic analysis failed.");
  } finally {
    btnAnalyze.disabled = false;
    btnAnalyze.textContent = "Analyze coverage";
  }
});

function renderResults(
  out: {
    mode: AnalysisMode;
    coverage: number;
    missingTerms: GapTerm[];
    weakParagraphs: ParagraphCoverage[];
    disclaimer: string;
  },
  uiMode: "lite" | "semantic",
) {
  results.classList.remove("hidden");
  setRing(out.coverage);
  if (uiMode === "semantic") {
    weakHeading.textContent = "JD sections least similar to your resume (semantic)";
    scoreCaption.textContent = `Semantic alignment (local embeddings): about ${Math.round(out.coverage * 100)}% mean best‑match per JD section.`;
  } else {
    weakHeading.textContent = "JD sections with low keyword overlap (lite)";
    scoreCaption.textContent = `Keyword / emphasis overlap: about ${Math.round(out.coverage * 100)}%.`;
  }
  disclaimer.textContent = out.disclaimer;

  missingTerms.innerHTML = "";
  for (const t of out.missingTerms) {
    const li = document.createElement("li");
    li.textContent = t.term;
    li.title = `weighted gap: ${t.weight.toFixed(2)}`;
    missingTerms.append(li);
  }

  weakParas.innerHTML = "";
  for (const p of out.weakParagraphs) {
    const li = document.createElement("li");
    const pct = Math.round(p.score * 100);
    if (uiMode === "semantic") {
      li.textContent = `${pct}% best match — ${p.excerpt}${p.excerpt.length >= 200 ? "…" : ""}`;
    } else {
      li.textContent = `${pct}% token overlap — ${p.excerpt}${p.excerpt.length >= 180 ? "…" : ""}`;
    }
    weakParas.append(li);
  }

  modeBadge.textContent =
    uiMode === "semantic" ? "Mode: semantic (local model)" : "Mode: lite (TF‑IDF)";
}

void refreshResumeList();
