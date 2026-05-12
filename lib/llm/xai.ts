// xAI adapter — uses the OpenAI-compatible Chat Completions endpoint at api.x.ai.
// Kept intentionally thin so future providers can reuse the same JSON contract.

import type {
  LlmAdapter,
  RephraseInput,
  RephraseOutput,
  WeeklyFeedbackInput,
  WeeklyFeedbackOutput,
} from "./types";
import { SYSTEM_PROMPT, buildUserMessage } from "./prompt";
import { WEEKLY_SYSTEM_PROMPT, buildWeeklyUserMessage } from "./weeklyPrompt";
import { parseLlmJson, parseWeeklyJson } from "./parse";

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
    const raw = await this.call(SYSTEM_PROMPT, buildUserMessage(input), 0.4);
    return parseLlmJson(raw);
  }

  async weeklyFeedback(input: WeeklyFeedbackInput): Promise<WeeklyFeedbackOutput> {
    const raw = await this.call(WEEKLY_SYSTEM_PROMPT, buildWeeklyUserMessage(input), 0.35);
    return parseWeeklyJson(raw, input.users.map((u) => u.id));
  }

  private async call(system: string, user: string, temperature: number): Promise<string> {
    const res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: this.cfg.model,
        temperature,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
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
    return data.choices?.[0]?.message?.content ?? "";
  }
}
