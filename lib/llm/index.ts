import type { LlmAdapter } from "./types";
import { XaiAdapter } from "./xai";
import { TemplateAdapter } from "./template";

export type LlmProvider = "xai" | "template" | "anthropic" | "openai";

// Resolve the active adapter at runtime so missing keys gracefully fall back
// to the template adapter instead of crashing the request.
export function getLlmAdapter(): LlmAdapter {
  const requested = (process.env.LLM_PROVIDER ?? "xai").toLowerCase() as LlmProvider;

  if (requested === "xai") {
    const apiKey = process.env.XAI_API_KEY?.trim();
    if (apiKey) {
      return new XaiAdapter({
        apiKey,
        model: process.env.XAI_MODEL?.trim() || "grok-4-latest",
      });
    }
    return new TemplateAdapter();
  }

  if (requested === "template") {
    return new TemplateAdapter();
  }

  // Anthropic / OpenAI adapters are reserved — wire them up when needed.
  // For now, fall back to template so the app keeps working.
  return new TemplateAdapter();
}

export type { LlmAdapter, RephraseInput, RephraseOutput } from "./types";
