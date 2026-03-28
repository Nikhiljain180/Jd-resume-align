import type { GetJdRequest, GetJdResponse } from "../messaging/protocol.js";

const GET_JD: GetJdRequest["type"] = "GET_JD_FROM_TAB";

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
