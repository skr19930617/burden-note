import { describe, expect, it } from "vitest";
import {
  cardSchema,
  gratitudeSchema,
  insightsResponseSchema,
  sharingSchema,
  visibilitySchema,
  weightSchema,
  bearerSchema,
  categorySchema,
  loadTypeSchema,
  depletedSchema,
  needSchema,
} from "@/lib/contracts";

describe("contracts: value enums", () => {
  it("sharingSchema accepts the three pipeline stages and rejects others", () => {
    expect(sharingSchema.safeParse("private").success).toBe(true);
    expect(sharingSchema.safeParse("candidate").success).toBe(true);
    expect(sharingSchema.safeParse("shared").success).toBe(true);
    expect(sharingSchema.safeParse("public").success).toBe(false);
  });

  it("categorySchema rejects retired values (illness/rest_lost/invisible)", () => {
    expect(categorySchema.safeParse("illness").success).toBe(false);
    expect(categorySchema.safeParse("rest_lost").success).toBe(false);
    expect(categorySchema.safeParse("invisible").success).toBe(false);
  });

  it("loadTypeSchema accepts 'invisible' (which moved into LOAD_TYPES)", () => {
    expect(loadTypeSchema.safeParse("invisible").success).toBe(true);
  });

  it("depletedSchema accepts 'recovery' and 'predictability'", () => {
    expect(depletedSchema.safeParse("recovery").success).toBe(true);
    expect(depletedSchema.safeParse("predictability").success).toBe(true);
  });

  it("needSchema accepts the newly-added 'acknowledge' and 'gentle_words'", () => {
    expect(needSchema.safeParse("acknowledge").success).toBe(true);
    expect(needSchema.safeParse("gentle_words").success).toBe(true);
  });

  it.each(["light", "moderate", "heavy", "very_heavy", "drained"])(
    "weightSchema accepts %s",
    (v) => {
      expect(weightSchema.safeParse(v).success).toBe(true);
    },
  );

  it.each(["self", "partner", "both", "drifted", "unclear"])(
    "bearerSchema accepts %s",
    (v) => {
      expect(bearerSchema.safeParse(v).success).toBe(true);
    },
  );

  it.each(["seen", "partly", "unseen", "want_seen", "ok_unseen"])(
    "visibilitySchema accepts %s",
    (v) => {
      expect(visibilitySchema.safeParse(v).success).toBe(true);
    },
  );
});

describe("contracts: object shapes reject extra/wrong fields", () => {
  const baseCard = {
    id: "c1",
    authorId: "u1",
    author: { id: "u1", name: "夫", color: null },
    title: "x",
    category: "night",
    privateText: null,
    loadTypes: ["sleep"],
    bearer: "self",
    weight: "heavy",
    depleted: ["sleep"],
    visibility: "partly",
    needs: ["acknowledge"],
    sharing: "shared",
    shareText: null,
    rephrasedAt: null,
    appreciation: null,
    selfCare: null,
    adviceTip: null,
    occurredAt: "2026-05-04T00:00:00.000Z",
    createdAt: "2026-05-04T00:00:00.000Z",
    updatedAt: "2026-05-04T00:00:00.000Z",
  } as const;

  it("a minimal valid card parses", () => {
    expect(() => cardSchema.parse(baseCard)).not.toThrow();
  });

  it("a card with a bad sharing value fails", () => {
    expect(() => cardSchema.parse({ ...baseCard, sharing: "public" })).toThrow();
  });

  it("a card with non-ISO occurredAt fails", () => {
    expect(() => cardSchema.parse({ ...baseCard, occurredAt: "2026/05/04" })).toThrow();
  });

  it("a gratitude with negative numeric fields fails the schema indirectly via insights", () => {
    const bad = {
      weeks: ["2026-05-04T00:00:00.000Z"],
      users: [{ id: "u1", name: "夫" }],
      reduceSeries: [
        {
          weekStart: "2026-05-04T00:00:00.000Z",
          pickedBurden: null,
          pickedBurdenLabel: null,
          intensity: -1,
        },
      ],
      visibilitySeries: [
        { weekStart: "2026-05-04T00:00:00.000Z", total: 0, invisible: 0, ratio: null },
      ],
      gratitudeSeries: [
        { weekStart: "2026-05-04T00:00:00.000Z", perUser: {} },
      ],
      referenceLabels: { categories: [], loadTypes: [] },
    };
    expect(() => insightsResponseSchema.parse(bad)).toThrow();
  });

  it("a gratitude with an unknown source fails", () => {
    expect(() =>
      gratitudeSchema.parse({
        id: "g1",
        fromUserId: "u1",
        toUserId: "u2",
        text: "x",
        cardId: null,
        source: "tweet",
        acknowledgedAt: null,
        createdAt: "2026-05-04T00:00:00.000Z",
      }),
    ).toThrow();
  });
});
