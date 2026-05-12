import { describe, expect, it } from "vitest";
import { TemplateAdapter } from "@/lib/llm/template";

const adapter = new TemplateAdapter();

describe("TemplateAdapter.rephraseForShare", () => {
  it("produces all 5 fields", async () => {
    const out = await adapter.rephraseForShare({
      authorName: "妻",
      partnerName: "夫",
      title: "夜中に2回起きた",
      category: "夜間対応",
      privateText: "つらかった",
      loadTypes: ["睡眠が削られた"],
      bearer: "self",
      weight: "heavy",
      depleted: ["睡眠", "回復する時間"],
      visibility: "partly",
      needs: ["acknowledge", "gentle_words"],
    });
    expect(out.sharedText.length).toBeGreaterThan(0);
    expect(out.oneLineInsight.length).toBeGreaterThan(0);
    expect(out.appreciation.length).toBeGreaterThan(0);
    expect(out.selfCare.length).toBeGreaterThan(0);
    expect(out.adviceTip.length).toBeGreaterThan(0);
  });

  it("selfCare references the author by name", async () => {
    const out = await adapter.rephraseForShare({
      authorName: "妻",
      partnerName: "夫",
      title: "x",
      category: "夜間対応",
      privateText: null,
      loadTypes: [],
      bearer: "self",
      weight: "moderate",
      depleted: [],
      visibility: "partly",
      needs: ["no_solve"],
    });
    expect(out.selfCare).toContain("妻");
  });

  it("adviceTip picks the strongest matching need", async () => {
    const out = await adapter.rephraseForShare({
      authorName: "夫",
      partnerName: "妻",
      title: "x",
      category: "夜間対応",
      privateText: null,
      loadTypes: [],
      bearer: "self",
      weight: "moderate",
      depleted: [],
      visibility: "partly",
      needs: ["acknowledge", "thanks"],
    });
    // 'acknowledge' has higher priority than 'thanks' in the priority list.
    expect(out.adviceTip).toContain("大変だったね");
  });
});

describe("TemplateAdapter.weeklyFeedback", () => {
  it("returns perUser entries for every requested user", async () => {
    const out = await adapter.weeklyFeedback({
      weekStart: "2026-05-04T00:00:00.000Z",
      users: [
        { id: "u1", name: "夫" },
        { id: "u2", name: "妻" },
      ],
      cards: [
        {
          authorId: "u1",
          authorName: "夫",
          title: "夜中対応",
          category: "夜間対応",
          loadTypes: ["睡眠が削られた"],
          depleted: ["睡眠"],
          visibility: "partly",
          weight: "重い",
          needs: ["ただ知ってほしい"],
          shareText: null,
        },
      ],
      pickedBurden: "夜間対応",
      previousNextMove: null,
    });
    expect(out.perUser).toHaveLength(2);
    expect(out.shared.whatWorked.length).toBeGreaterThan(0);
    expect(out.shared.nextMove.length).toBeGreaterThan(0);
  });

  it("handles an empty week gracefully", async () => {
    const out = await adapter.weeklyFeedback({
      weekStart: "2026-05-04T00:00:00.000Z",
      users: [{ id: "u1", name: "夫" }],
      cards: [],
      pickedBurden: null,
      previousNextMove: null,
    });
    expect(out.perUser).toHaveLength(1);
    expect(out.shared.whatWorked.length).toBeGreaterThan(0);
  });
});
