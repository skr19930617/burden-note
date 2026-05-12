import { describe, expect, it } from "vitest";
import { parseLlmJson, parseWeeklyJson } from "@/lib/llm/parse";

describe("parseLlmJson", () => {
  it("parses a clean object", () => {
    const out = parseLlmJson(
      JSON.stringify({
        sharedText: "shared",
        oneLineInsight: "insight",
        appreciation: "a",
        selfCare: "s",
        adviceTip: "t",
      }),
    );
    expect(out.sharedText).toBe("shared");
    expect(out.appreciation).toBe("a");
    expect(out.selfCare).toBe("s");
    expect(out.adviceTip).toBe("t");
  });

  it("strips a leading ```json fence", () => {
    const raw = "```json\n" + JSON.stringify({
      sharedText: "x",
      oneLineInsight: "y",
      appreciation: "",
      selfCare: "",
      adviceTip: "",
    }) + "\n```";
    const out = parseLlmJson(raw);
    expect(out.sharedText).toBe("x");
  });

  it("extracts JSON when the model adds prose around it", () => {
    const raw = "Sure! Here you go:\n{\"sharedText\":\"hi\",\"oneLineInsight\":\"\",\"appreciation\":\"\",\"selfCare\":\"\",\"adviceTip\":\"\"}\nThanks!";
    const out = parseLlmJson(raw);
    expect(out.sharedText).toBe("hi");
  });

  it("treats missing optional fields as empty strings", () => {
    const out = parseLlmJson(JSON.stringify({ sharedText: "x" }));
    expect(out.oneLineInsight).toBe("");
    expect(out.appreciation).toBe("");
    expect(out.selfCare).toBe("");
    expect(out.adviceTip).toBe("");
  });

  it("throws when sharedText is missing", () => {
    expect(() => parseLlmJson(JSON.stringify({ oneLineInsight: "x" }))).toThrow();
  });

  it("throws on non-JSON garbage", () => {
    expect(() => parseLlmJson("definitely not json")).toThrow();
  });
});

describe("parseWeeklyJson", () => {
  it("parses a valid bundle and preserves perUser entries", () => {
    const out = parseWeeklyJson(
      JSON.stringify({
        perUser: [
          { userId: "u1", observation: "o1", gentleNotice: "g1" },
          { userId: "u2", observation: "o2", gentleNotice: "g2" },
        ],
        shared: { whatWorked: "w", nextMove: "n" },
      }),
      ["u1", "u2"],
    );
    expect(out.perUser).toHaveLength(2);
    expect(out.shared.whatWorked).toBe("w");
    expect(out.shared.nextMove).toBe("n");
  });

  it("fills missing expected users with empty rows", () => {
    const out = parseWeeklyJson(
      JSON.stringify({
        perUser: [{ userId: "u1", observation: "o", gentleNotice: "g" }],
        shared: { whatWorked: "", nextMove: "" },
      }),
      ["u1", "u2"],
    );
    expect(out.perUser).toHaveLength(2);
    const u2 = out.perUser.find((p) => p.userId === "u2");
    expect(u2?.observation).toBe("");
  });

  it("ignores entries without userId or observation", () => {
    const out = parseWeeklyJson(
      JSON.stringify({
        perUser: [
          { userId: "u1", observation: "ok", gentleNotice: "" },
          { observation: "no id" },
          { userId: "u3", observation: "" },
        ],
        shared: { whatWorked: "", nextMove: "" },
      }),
      ["u1"],
    );
    expect(out.perUser).toHaveLength(1);
    expect(out.perUser[0].userId).toBe("u1");
  });
});
