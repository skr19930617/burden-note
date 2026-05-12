import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getLlmAdapter } from "@/lib/llm";

const savedProvider = process.env.LLM_PROVIDER;
const savedKey = process.env.XAI_API_KEY;

describe("getLlmAdapter", () => {
  beforeEach(() => {
    process.env.LLM_PROVIDER = "xai";
    process.env.XAI_API_KEY = "";
  });

  afterEach(() => {
    process.env.LLM_PROVIDER = savedProvider;
    process.env.XAI_API_KEY = savedKey;
  });

  it("falls back to template when LLM_PROVIDER=xai but no key", () => {
    expect(getLlmAdapter().name).toBe("template");
  });

  it("returns template when explicitly requested", () => {
    process.env.LLM_PROVIDER = "template";
    expect(getLlmAdapter().name).toBe("template");
  });

  it("returns xai adapter only when a key is present", () => {
    process.env.LLM_PROVIDER = "xai";
    process.env.XAI_API_KEY = "sk-xxx";
    expect(getLlmAdapter().name).toBe("xai");
  });

  it("unknown provider falls back to template", () => {
    process.env.LLM_PROVIDER = "anthropic";
    expect(getLlmAdapter().name).toBe("template");
  });
});
