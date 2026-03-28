/**
 * Cross-context message contracts (background, content, side panel).
 * When adding a new message type, document it here and in CONTRIBUTING.md.
 */

export type GetJdRequest = { type: "GET_JD_FROM_TAB" };
export type GetJdResponse =
  | { ok: true; text: string; source: "linkedin" | "unknown" }
  | { ok: false; error: string };

export type Ping = { type: "PING" };
