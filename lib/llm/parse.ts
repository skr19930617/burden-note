import type { RephraseOutput, WeeklyFeedbackOutput } from "./types";

// LLMs occasionally wrap JSON in code fences or add a prose preamble. Be lenient.
export function parseLlmJson(raw: string): RephraseOutput {
  const cleaned = stripFences(raw).trim();
  const jsonChunk = extractFirstJsonObject(cleaned) ?? cleaned;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonChunk);
  } catch (err) {
    throw new Error(`LLM returned non-JSON output: ${raw.slice(0, 200)}`);
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("LLM JSON was not an object");
  }
  const obj = parsed as Record<string, unknown>;
  const sharedText = typeof obj.sharedText === "string" ? obj.sharedText.trim() : "";
  const oneLineInsight = typeof obj.oneLineInsight === "string" ? obj.oneLineInsight.trim() : "";
  const appreciation = typeof obj.appreciation === "string" ? obj.appreciation.trim() : "";
  const selfCare = typeof obj.selfCare === "string" ? obj.selfCare.trim() : "";
  const adviceTip = typeof obj.adviceTip === "string" ? obj.adviceTip.trim() : "";

  if (!sharedText) {
    throw new Error("LLM JSON missing sharedText");
  }
  // appreciation / selfCare / adviceTip are best-effort. If the model omits them, default to empty
  // (UI will hide the section rather than show a placeholder).
  return { sharedText, oneLineInsight, appreciation, selfCare, adviceTip };
}

// Parse the weekly feedback JSON. Validates that every expected userId is covered.
export function parseWeeklyJson(raw: string, expectedUserIds: string[]): WeeklyFeedbackOutput {
  const cleaned = stripFences(raw).trim();
  const jsonChunk = extractFirstJsonObject(cleaned) ?? cleaned;
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonChunk);
  } catch {
    throw new Error(`LLM returned non-JSON output: ${raw.slice(0, 200)}`);
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("weekly LLM JSON was not an object");
  }
  const obj = parsed as Record<string, unknown>;

  const perUserRaw = Array.isArray(obj.perUser) ? obj.perUser : [];
  const perUser = perUserRaw
    .map((entry) => {
      if (typeof entry !== "object" || entry === null) return null;
      const e = entry as Record<string, unknown>;
      const userId = typeof e.userId === "string" ? e.userId : "";
      const observation =
        typeof e.observation === "string" ? e.observation.trim() : "";
      const gentleNotice =
        typeof e.gentleNotice === "string" ? e.gentleNotice.trim() : "";
      if (!userId || !observation) return null;
      return { userId, observation, gentleNotice };
    })
    .filter(<T>(x: T | null): x is T => x !== null);

  // Make sure every expected user appears. Missing ones get blank notice so the UI
  // can still render something.
  for (const uid of expectedUserIds) {
    if (!perUser.find((p) => p.userId === uid)) {
      perUser.push({ userId: uid, observation: "", gentleNotice: "" });
    }
  }

  const sharedRaw = (obj.shared ?? {}) as Record<string, unknown>;
  const whatWorked = typeof sharedRaw.whatWorked === "string" ? sharedRaw.whatWorked.trim() : "";
  const nextMove = typeof sharedRaw.nextMove === "string" ? sharedRaw.nextMove.trim() : "";

  return { perUser, shared: { whatWorked, nextMove } };
}

function stripFences(s: string): string {
  return s
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "");
}

function extractFirstJsonObject(s: string): string | null {
  const start = s.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}
