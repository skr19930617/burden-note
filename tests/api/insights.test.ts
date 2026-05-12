import { beforeEach, describe, expect, it } from "vitest";
import { GET as getInsights } from "@/app/api/insights/weekly/route";
import { POST as createCard } from "@/app/api/cards/route";
import {
  POST as createGratitude,
} from "@/app/api/gratitudes/route";
import { POST as ackGratitude } from "@/app/api/gratitudes/[id]/acknowledge/route";
import {
  cardSingleResponseSchema,
  gratitudeSingleResponseSchema,
  insightsResponseSchema,
} from "@/lib/contracts";
import { getRequest, jsonRequest, readJson, resetDb, seedTwoUsers } from "../helpers";

function thisWeekMondayIso(): string {
  const d = new Date();
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

describe("/api/insights/weekly", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("returns the expected schema when empty", async () => {
    await seedTwoUsers();
    const res = await getInsights(getRequest("http://test/api/insights/weekly?weeks=4"));
    expect(res.status).toBe(200);
    const data = insightsResponseSchema.parse(await readJson(res));
    expect(data.weeks).toHaveLength(4);
    expect(data.users).toHaveLength(2);
    expect(data.reduceSeries).toHaveLength(4);
    expect(data.visibilitySeries).toHaveLength(4);
    expect(data.gratitudeSeries).toHaveLength(4);
  });

  it("visibility ratio reflects unseen/want_seen cards", async () => {
    const { husband } = await seedTwoUsers();
    const week = thisWeekMondayIso();
    // 2 cards: one unseen, one seen.
    for (const v of ["unseen", "seen"] as const) {
      cardSingleResponseSchema.parse(
        await readJson(
          await createCard(
            jsonRequest("http://test/api/cards", {
              method: "POST",
              body: {
                authorId: husband.id,
                title: `t-${v}`,
                category: "night",
                loadTypes: ["sleep"],
                bearer: "self",
                weight: "heavy",
                depleted: ["sleep"],
                visibility: v,
                needs: ["just_know"],
                sharing: "shared",
                occurredAt: week,
              },
            }),
          ),
        ),
      );
    }
    const data = insightsResponseSchema.parse(
      await readJson(await getInsights(getRequest("http://test/api/insights/weekly?weeks=4"))),
    );
    const thisWeek = data.visibilitySeries[data.visibilitySeries.length - 1];
    expect(thisWeek.total).toBe(2);
    expect(thisWeek.invisible).toBe(1);
    expect(thisWeek.ratio).toBeCloseTo(0.5);
  });

  it("gratitude series only counts ack'd rows in ackReceived", async () => {
    const { husband, wife } = await seedTwoUsers();
    const a = gratitudeSingleResponseSchema.parse(
      await readJson(
        await createGratitude(
          jsonRequest("http://test/api/gratitudes", {
            method: "POST",
            body: { fromUserId: wife.id, toUserId: husband.id, text: "1" },
          }),
        ),
      ),
    );
    await createGratitude(
      jsonRequest("http://test/api/gratitudes", {
        method: "POST",
        body: { fromUserId: wife.id, toUserId: husband.id, text: "2" },
      }),
    );
    await ackGratitude(
      jsonRequest(`http://test/api/gratitudes/${a.gratitude.id}/acknowledge`, {
        method: "POST",
        body: { acked: true },
      }),
      { params: { id: a.gratitude.id } },
    );

    const data = insightsResponseSchema.parse(
      await readJson(await getInsights(getRequest("http://test/api/insights/weekly?weeks=4"))),
    );
    const thisWeek = data.gratitudeSeries[data.gratitudeSeries.length - 1];
    expect(thisWeek.perUser[husband.id].sent).toBe(0);
    expect(thisWeek.perUser[husband.id].ackReceived).toBe(1);
    expect(thisWeek.perUser[wife.id].sent).toBe(2);
    expect(thisWeek.perUser[wife.id].ackReceived).toBe(0);
  });
});
