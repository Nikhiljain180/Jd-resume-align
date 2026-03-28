import type { GetJdRequest, GetJdResponse } from "../messaging/protocol.js";

/**
 * LinkedIn job pages change often. Prefer resilient selectors + fallbacks.
 * Contributing: see CONTRIBUTING.md for how to update selectors with screenshots.
 */

const SELECTORS = [
  ".description__text",
  ".jobs-description-content__text",
  ".jobs-description__text",
  "[data-test-job-description-text]",
  "article.jobs-description__container",
] as const;

function collectVisibleText(root: Element): string {
  const bits: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const t = node.nodeValue?.trim();
      if (!t) return NodeFilter.FILTER_REJECT;
      const el = node.parentElement;
      if (!el) return NodeFilter.FILTER_REJECT;
      const tag = el.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n = walker.nextNode();
  while (n) {
    const t = n.nodeValue?.trim();
    if (t) bits.push(t);
    n = walker.nextNode();
  }
  return bits.join("\n");
}

function extractLinkedInJd(): string | null {
  for (const sel of SELECTORS) {
    const el = document.querySelector(sel);
    if (el instanceof HTMLElement) {
      const text = collectVisibleText(el).trim();
      if (text.length > 80) return text;
    }
  }
  const article = document.querySelector("div.jobs-details__main-content");
  if (article) {
    const text = collectVisibleText(article).trim();
    if (text.length > 80) return text;
  }
  return null;
}

function onMessage(
  message: { type?: string },
  _sender: chrome.runtime.MessageSender,
  sendResponse: (r: GetJdResponse) => void,
): true | undefined {
  const req: GetJdRequest["type"] = "GET_JD_FROM_TAB";
  if (message?.type !== req) return undefined;
  const text = extractLinkedInJd();
  if (!text) {
    sendResponse({
      ok: false,
      error:
        "Could not find the job description on this page. Open a full job posting or select the JD text and use paste in the side panel.",
    });
    return true;
  }
  sendResponse({ ok: true, text, source: "linkedin" });
  return true;
}

chrome.runtime.onMessage.addListener(onMessage);
