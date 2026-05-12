import type { RephraseOutput } from "./types";

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

  if (!sharedText) {
    throw new Error("LLM JSON missing sharedText");
  }
  return { sharedText, oneLineInsight };
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
