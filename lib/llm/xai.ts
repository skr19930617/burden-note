// xAI adapter — uses the OpenAI-compatible Chat Completions endpoint at api.x.ai.
// Kept intentionally thin so future providers can reuse the same JSON contract.

import type { LlmAdapter, RephraseInput, RephraseOutput } from "./types";
import { SYSTEM_PROMPT, buildUserMessage } from "./prompt";
import { parseLlmJson } from "./parse";

interface XaiConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export class XaiAdapter implements LlmAdapter {
  readonly name = "xai";
  private readonly cfg: XaiConfig;

  constructor(cfg: XaiConfig) {
    this.cfg = { baseUrl: "https://api.x.ai/v1", ...cfg };
  }

  async rephraseForShare(input: RephraseInput): Promise<RephraseOutput> {
    const res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: this.cfg.model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(input) },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`xAI request failed: ${res.status} ${res.statusText} — ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content ?? "";
    return parseLlmJson(raw);
  }
}
