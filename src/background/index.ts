import type { GetJdRequest, GetJdResponse, SemanticAnalyzeResponse } from "../messaging/protocol.js";

const GET_JD: GetJdRequest["type"] = "GET_JD_FROM_TAB";
const SEMANTIC_ANALYZE = "SEMANTIC_ANALYZE" as const;
const OFFSCREEN_ANALYZE = "OFFSCREEN_ANALYZE" as const;

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === GET_JD) {
    void resolveJdFromActiveTab().then(sendResponse);
    return true;
  }
  if (message?.type === SEMANTIC_ANALYZE) {
    void runSemanticAnalyze(message.jd as string, message.resume as string).then(sendResponse);
    return true;
  }
  return undefined;
});

async function resolveJdFromActiveTab(): Promise<GetJdResponse> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab?.id) {
      return { ok: false, error: "No active tab." };
    }
    const url = tab.url ?? "";
    if (!url.includes("linkedin.com")) {
      return {
        ok: false,
        error: "Active tab is not LinkedIn. Paste the job description or open a LinkedIn job page.",
      };
    }
    const res = await chrome.tabs.sendMessage(tab.id, { type: GET_JD });
    if (res && typeof res === "object" && "ok" in res) {
      return res as GetJdResponse;
    }
    return { ok: false, error: "Unexpected response from content script." };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Could not establish connection")) {
      return {
        ok: false,
        error: "Content script not ready. Refresh the LinkedIn tab or wait for the page to finish loading.",
      };
    }
    return { ok: false, error: msg };
  }
}

async function offscreenAlreadyOpen(): Promise<boolean> {
  const runtime = chrome.runtime as typeof chrome.runtime & {
    getContexts?: (filter: { contextTypes: string[] }) => Promise<Array<{ contextType: string }>>;
  };
  if (!runtime.getContexts) return false;
  const contexts = await runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"] });
  return contexts.length > 0;
}

async function ensureOffscreen(): Promise<void> {
  if (await offscreenAlreadyOpen()) return;
  try {
    await chrome.offscreen.createDocument({
      url: "offscreen/index.html",
      reasons: [chrome.offscreen.Reason.WORKERS],
      justification: "Run ONNX/WASM sentence embeddings locally for JD/resume alignment.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Only a single offscreen document") || msg.includes("already exists")) {
      return;
    }
    throw e;
  }
}

async function runSemanticAnalyze(jd: string, resume: string): Promise<SemanticAnalyzeResponse> {
  try {
    await ensureOffscreen();
    const relay = await chrome.runtime.sendMessage({
      type: OFFSCREEN_ANALYZE,
      jd,
      resume,
    });
    if (relay && typeof relay === "object" && "ok" in relay) {
      return relay as SemanticAnalyzeResponse;
    }
    return { ok: false, error: "Unexpected response from embedding worker." };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
