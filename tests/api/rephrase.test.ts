import { beforeEach, describe, expect, it } from "vitest";
import { POST as createCard } from "@/app/api/cards/route";
import { POST as rephrase } from "@/app/api/cards/[id]/rephrase/route";
import { GET as getCard } from "@/app/api/cards/[id]/route";
import {
  cardSingleResponseSchema,
  rephraseResponseSchema,
  type CardCreateRequest,
} from "@/lib/contracts";
import { jsonRequest, getRequest, readJson, resetDb, seedTwoUsers } from "../helpers";

function payload(authorId: string): CardCreateRequest {
  return {
    authorId,
    title: "夜中に2回起きた",
    category: "night",
    loadTypes: ["sleep"],
    bearer: "self",
    weight: "heavy",
    depleted: ["sleep"],
    visibility: "partly",
    needs: ["acknowledge"],
    sharing: "candidate",
  };
}

describe("/api/cards/[id]/rephrase", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("template adapter returns all 5 fields and persists shareText + appreciation + selfCare + adviceTip", async () => {
    const { husband } = await seedTwoUsers();
    const card = cardSingleResponseSchema.parse(
      await readJson(
        await createCard(
          jsonRequest("http://test/api/cards", { method: "POST", body: payload(husband.id) }),
        ),
      ),
    );

    const res = await rephrase(getRequest(`http://test/api/cards/${card.card.id}/rephrase`), {
      params: { id: card.card.id },
    });
    expect(res.status).toBe(200);
    const data = rephraseResponseSchema.parse(await readJson(res));
    expect(data.adapter).toBe("template");
    expect(data.sharedText.length).toBeGreaterThan(0);
    expect(data.selfCare.length).toBeGreaterThan(0);
    expect(data.appreciation.length).toBeGreaterThan(0);
    expect(data.adviceTip.length).toBeGreaterThan(0);

    // Persisted
    const refreshed = cardSingleResponseSchema.parse(
      await readJson(
        await getCard(getRequest(`http://test/api/cards/${card.card.id}`), {
          params: { id: card.card.id },
        }),
      ),
    );
    expect(refreshed.card.shareText).toBe(data.sharedText);
    expect(refreshed.card.appreciation).toBe(data.appreciation);
    expect(refreshed.card.selfCare).toBe(data.selfCare);
    expect(refreshed.card.adviceTip).toBe(data.adviceTip);
    expect(refreshed.card.rephrasedAt).not.toBeNull();
  });

  it("returns 404 for unknown card id", async () => {
    const res = await rephrase(getRequest("http://test/api/cards/zzz/rephrase"), {
      params: { id: "zzz" },
    });
    expect(res.status).toBe(404);
  });
});
