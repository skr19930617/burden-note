import { beforeEach, describe, expect, it } from "vitest";
import {
  GET as listGratitudes,
  POST as createGratitude,
} from "@/app/api/gratitudes/route";
import { POST as ackGratitude } from "@/app/api/gratitudes/[id]/acknowledge/route";
import { POST as createCard } from "@/app/api/cards/route";
import { POST as sendAppreciation } from "@/app/api/cards/[id]/send-appreciation/route";
import {
  cardSingleResponseSchema,
  gratitudeListResponseSchema,
  gratitudeSingleResponseSchema,
} from "@/lib/contracts";
import { getRequest, jsonRequest, readJson, resetDb, seedTwoUsers } from "../helpers";

describe("/api/gratitudes", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("POST creates a gratitude with default source=button", async () => {
    const { husband, wife } = await seedTwoUsers();
    const res = await createGratitude(
      jsonRequest("http://test/api/gratitudes", {
        method: "POST",
        body: { fromUserId: wife.id, toUserId: husband.id, text: "ありがとう" },
      }),
    );
    expect(res.status).toBe(200);
    const data = gratitudeSingleResponseSchema.parse(await readJson(res));
    expect(data.gratitude.source).toBe("button");
    expect(data.gratitude.acknowledgedAt).toBeNull();
    expect(data.gratitude.text).toBe("ありがとう");
  });

  it("POST rejects an unknown source", async () => {
    const { husband, wife } = await seedTwoUsers();
    const res = await createGratitude(
      jsonRequest("http://test/api/gratitudes", {
        method: "POST",
        body: { fromUserId: wife.id, toUserId: husband.id, text: "x", source: "tweet" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("GET filters by toUserId / acked", async () => {
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
        body: { fromUserId: husband.id, toUserId: wife.id, text: "2" },
      }),
    );
    // Ack 'a'
    await ackGratitude(
      jsonRequest(`http://test/api/gratitudes/${a.gratitude.id}/acknowledge`, {
        method: "POST",
        body: { acked: true },
      }),
      { params: { id: a.gratitude.id } },
    );

    const toHusband = gratitudeListResponseSchema.parse(
      await readJson(
        await listGratitudes(getRequest(`http://test/api/gratitudes?toUserId=${husband.id}`)),
      ),
    );
    expect(toHusband.gratitudes).toHaveLength(1);

    const ackedOnly = gratitudeListResponseSchema.parse(
      await readJson(await listGratitudes(getRequest(`http://test/api/gratitudes?acked=true`))),
    );
    expect(ackedOnly.gratitudes.every((g) => g.acknowledgedAt !== null)).toBe(true);
    expect(ackedOnly.gratitudes).toHaveLength(1);
  });

  it("ack toggle on then off", async () => {
    const { husband, wife } = await seedTwoUsers();
    const g = gratitudeSingleResponseSchema.parse(
      await readJson(
        await createGratitude(
          jsonRequest("http://test/api/gratitudes", {
            method: "POST",
            body: { fromUserId: wife.id, toUserId: husband.id, text: "x" },
          }),
        ),
      ),
    );

    const on = gratitudeSingleResponseSchema.parse(
      await readJson(
        await ackGratitude(
          jsonRequest(`http://test/api/gratitudes/${g.gratitude.id}/acknowledge`, {
            method: "POST",
            body: { acked: true },
          }),
          { params: { id: g.gratitude.id } },
        ),
      ),
    );
    expect(on.gratitude.acknowledgedAt).not.toBeNull();

    const off = gratitudeSingleResponseSchema.parse(
      await readJson(
        await ackGratitude(
          jsonRequest(`http://test/api/gratitudes/${g.gratitude.id}/acknowledge`, {
            method: "POST",
            body: { acked: false },
          }),
          { params: { id: g.gratitude.id } },
        ),
      ),
    );
    expect(off.gratitude.acknowledgedAt).toBeNull();
  });

  it("send-appreciation creates a Gratitude with source=ai_draft from the card author to the partner", async () => {
    const { husband, wife } = await seedTwoUsers();
    const card = cardSingleResponseSchema.parse(
      await readJson(
        await createCard(
          jsonRequest("http://test/api/cards", {
            method: "POST",
            body: {
              authorId: husband.id,
              title: "夜中対応した",
              category: "night",
              loadTypes: ["sleep"],
              bearer: "self",
              weight: "heavy",
              depleted: ["sleep"],
              visibility: "partly",
              needs: ["just_know"],
              sharing: "shared",
            },
          }),
        ),
      ),
    );
    const res = await sendAppreciation(
      jsonRequest(`http://test/api/cards/${card.card.id}/send-appreciation`, {
        method: "POST",
        body: { text: "助かった、ありがとう" },
      }),
      { params: { id: card.card.id } },
    );
    expect(res.status).toBe(200);
    const data = gratitudeSingleResponseSchema.parse(await readJson(res));
    expect(data.gratitude.source).toBe("ai_draft");
    expect(data.gratitude.fromUserId).toBe(husband.id);
    expect(data.gratitude.toUserId).toBe(wife.id);
    expect(data.gratitude.cardId).toBe(card.card.id);
  });
});
