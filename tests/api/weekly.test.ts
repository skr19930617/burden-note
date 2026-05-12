import { beforeEach, describe, expect, it } from "vitest";
import { GET as listPicks, POST as upsertPick } from "@/app/api/weekly/route";
import {
  GET as getFeedback,
  POST as triggerFeedback,
} from "@/app/api/weekly/feedback/route";
import { PATCH as patchFeedback } from "@/app/api/weekly/feedback/[userId]/route";
import { POST as createCard } from "@/app/api/cards/route";
import {
  cardSingleResponseSchema,
  weeklyFeedbackBundleSchema,
  weeklyFeedbackPatchResponseSchema,
  weeklyFeedbackTriggerResponseSchema,
  weeklyPickListResponseSchema,
  weeklyPickSingleResponseSchema,
} from "@/lib/contracts";
import { getRequest, jsonRequest, readJson, resetDb, seedTwoUsers } from "../helpers";

// Monday UTC of "this" week as ISO. We'll align cards to that day so they fall in
// the same week as the feedback trigger.
function thisWeekMondayIso(): string {
  const d = new Date();
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

describe("/api/weekly (pick)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("POST upserts a known pick and rejects unknown nextAction", async () => {
    const ok = await upsertPick(
      jsonRequest("http://test/api/weekly", {
        method: "POST",
        body: {
          weekStart: thisWeekMondayIso(),
          pickedBurden: "night",
          nextAction: "define_steps",
          note: "メモ",
        },
      }),
    );
    expect(ok.status).toBe(200);
    weeklyPickSingleResponseSchema.parse(await readJson(ok));

    const bad = await upsertPick(
      jsonRequest("http://test/api/weekly", {
        method: "POST",
        body: {
          weekStart: thisWeekMondayIso(),
          pickedBurden: "night",
          nextAction: "tweet",
        },
      }),
    );
    expect(bad.status).toBe(400);
  });

  it("POST upsert is idempotent on weekStart", async () => {
    const week = thisWeekMondayIso();
    await upsertPick(
      jsonRequest("http://test/api/weekly", {
        method: "POST",
        body: { weekStart: week, pickedBurden: "night" },
      }),
    );
    await upsertPick(
      jsonRequest("http://test/api/weekly", {
        method: "POST",
        body: { weekStart: week, pickedBurden: "rest_shortage" },
      }),
    );
    const data = weeklyPickListResponseSchema.parse(await readJson(await listPicks()));
    expect(data.picks).toHaveLength(1);
    expect(data.picks[0].pickedBurden).toBe("rest_shortage");
  });

  it("POST accepts a free-form pickedBurden when no REDUCE_TARGETS match", async () => {
    const res = await upsertPick(
      jsonRequest("http://test/api/weekly", {
        method: "POST",
        body: {
          weekStart: thisWeekMondayIso(),
          pickedBurden: "訪問看護への説明",
        },
      }),
    );
    expect(res.status).toBe(200);
  });
});

describe("/api/weekly/feedback", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("GET on a week with no data returns empty perUser + null pick", async () => {
    const week = thisWeekMondayIso();
    const res = await getFeedback(
      getRequest(`http://test/api/weekly/feedback?week=${encodeURIComponent(week)}`),
    );
    expect(res.status).toBe(200);
    const data = weeklyFeedbackBundleSchema.parse(await readJson(res));
    expect(data.perUser).toEqual([]);
    expect(data.pick).toBeNull();
  });

  it("POST generates per-user observations via template adapter and writes whatWorked/nextMove", async () => {
    const { husband, wife } = await seedTwoUsers();
    const week = thisWeekMondayIso();

    // Seed one shared card per user in the same week (occurredAt = week start).
    for (const u of [husband, wife]) {
      const c = await createCard(
        jsonRequest("http://test/api/cards", {
          method: "POST",
          body: {
            authorId: u.id,
            title: `${u.name}のカード`,
            category: "night",
            loadTypes: ["sleep"],
            bearer: "self",
            weight: "heavy",
            depleted: ["sleep"],
            visibility: "partly",
            needs: ["just_know"],
            sharing: "shared",
            occurredAt: week,
          },
        }),
      );
      cardSingleResponseSchema.parse(await readJson(c));
    }

    const res = await triggerFeedback(
      jsonRequest("http://test/api/weekly/feedback", {
        method: "POST",
        body: { weekStart: week },
      }),
    );
    expect(res.status).toBe(200);
    const data = weeklyFeedbackTriggerResponseSchema.parse(await readJson(res));
    expect(data.adapter).toBe("template");
    expect(data.perUser).toHaveLength(2);
    expect(data.pick).not.toBeNull();
    expect(data.pick?.whatWorked).toBeTruthy();
    expect(data.pick?.nextMove).toBeTruthy();
  });

  it("PATCH /api/weekly/feedback/[userId] updates feltAcknowledged", async () => {
    const { husband } = await seedTwoUsers();
    const week = thisWeekMondayIso();

    // First create at least one card and trigger feedback so a row exists to patch.
    await createCard(
      jsonRequest("http://test/api/cards", {
        method: "POST",
        body: {
          authorId: husband.id,
          title: "x",
          category: "night",
          loadTypes: ["sleep"],
          bearer: "self",
          weight: "heavy",
          depleted: ["sleep"],
          visibility: "partly",
          needs: ["just_know"],
          sharing: "shared",
          occurredAt: week,
        },
      }),
    );
    await triggerFeedback(
      jsonRequest("http://test/api/weekly/feedback", {
        method: "POST",
        body: { weekStart: week },
      }),
    );

    const res = await patchFeedback(
      jsonRequest(
        `http://test/api/weekly/feedback/${husband.id}?week=${encodeURIComponent(week)}`,
        { method: "PATCH", body: { feltAcknowledged: "a_little" } },
      ),
      { params: { userId: husband.id } },
    );
    expect(res.status).toBe(200);
    const data = weeklyFeedbackPatchResponseSchema.parse(await readJson(res));
    expect(data.feedback.feltAcknowledged).toBe("a_little");
  });

  it("PATCH rejects an unknown feltAcknowledged value", async () => {
    const { husband } = await seedTwoUsers();
    const week = thisWeekMondayIso();
    const res = await patchFeedback(
      jsonRequest(
        `http://test/api/weekly/feedback/${husband.id}?week=${encodeURIComponent(week)}`,
        { method: "PATCH", body: { feltAcknowledged: "maybe" } },
      ),
      { params: { userId: husband.id } },
    );
    expect(res.status).toBe(400);
  });
});
