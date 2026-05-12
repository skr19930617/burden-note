import { beforeEach, describe, expect, it } from "vitest";
import {
  GET as listCards,
  POST as createCard,
} from "@/app/api/cards/route";
import {
  GET as getCard,
  PATCH as patchCard,
  DELETE as deleteCard,
} from "@/app/api/cards/[id]/route";
import {
  cardListResponseSchema,
  cardSingleResponseSchema,
  type CardCreateRequest,
} from "@/lib/contracts";
import { getRequest, jsonRequest, readJson, resetDb, seedTwoUsers } from "../helpers";

function validPayload(authorId: string, overrides: Partial<CardCreateRequest> = {}): CardCreateRequest {
  return {
    authorId,
    title: "夜中に2回起きた",
    category: "night",
    loadTypes: ["sleep", "physical"],
    bearer: "self",
    weight: "heavy",
    depleted: ["sleep", "recovery"],
    visibility: "partly",
    needs: ["acknowledge"],
    sharing: "private",
    ...overrides,
  };
}

describe("/api/cards", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("POST creates a card and the response conforms to schema", async () => {
    const { husband } = await seedTwoUsers();
    const res = await createCard(
      jsonRequest("http://test/api/cards", { method: "POST", body: validPayload(husband.id) }),
    );
    expect(res.status).toBe(200);
    const data = cardSingleResponseSchema.parse(await readJson(res));
    expect(data.card.title).toBe("夜中に2回起きた");
    expect(data.card.author.id).toBe(husband.id);
    expect(data.card.loadTypes).toEqual(["sleep", "physical"]);
    expect(data.card.needs).toEqual(["acknowledge"]);
    expect(data.card.shareText).toBeNull();
    expect(data.card.rephrasedAt).toBeNull();
  });

  it("POST rejects an unknown category value", async () => {
    const { husband } = await seedTwoUsers();
    const res = await createCard(
      jsonRequest("http://test/api/cards", {
        method: "POST",
        // @ts-expect-error — testing runtime rejection of an invalid value
        body: validPayload(husband.id, { category: "not_a_category" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("POST rejects an unknown loadType value", async () => {
    const { husband } = await seedTwoUsers();
    const res = await createCard(
      jsonRequest("http://test/api/cards", {
        method: "POST",
        body: {
          ...validPayload(husband.id),
          loadTypes: ["sleep", "not_real"],
        },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("GET returns a list filterable by author + sharing", async () => {
    const { husband, wife } = await seedTwoUsers();
    await createCard(
      jsonRequest("http://test/api/cards", {
        method: "POST",
        body: validPayload(husband.id, { sharing: "shared" }),
      }),
    );
    await createCard(
      jsonRequest("http://test/api/cards", {
        method: "POST",
        body: validPayload(wife.id, { sharing: "private" }),
      }),
    );

    const allRes = await listCards(getRequest("http://test/api/cards"));
    const all = cardListResponseSchema.parse(await readJson(allRes));
    expect(all.cards).toHaveLength(2);

    const sharedRes = await listCards(
      getRequest("http://test/api/cards?sharing=shared"),
    );
    const shared = cardListResponseSchema.parse(await readJson(sharedRes));
    expect(shared.cards.every((c) => c.sharing === "shared")).toBe(true);

    const mineRes = await listCards(
      getRequest(`http://test/api/cards?authorId=${wife.id}`),
    );
    const mine = cardListResponseSchema.parse(await readJson(mineRes));
    expect(mine.cards.every((c) => c.author.id === wife.id)).toBe(true);
  });

  it("GET rejects invalid sharing query with 400", async () => {
    const res = await listCards(
      getRequest("http://test/api/cards?sharing=bogus"),
    );
    expect(res.status).toBe(400);
  });

  it("GET by id returns the card with author and arrays expanded", async () => {
    const { husband } = await seedTwoUsers();
    const created = cardSingleResponseSchema.parse(
      await readJson(
        await createCard(
          jsonRequest("http://test/api/cards", { method: "POST", body: validPayload(husband.id) }),
        ),
      ),
    );
    const res = await getCard(getRequest(`http://test/api/cards/${created.card.id}`), {
      params: { id: created.card.id },
    });
    const data = cardSingleResponseSchema.parse(await readJson(res));
    expect(data.card.id).toBe(created.card.id);
    expect(data.card.author.name).toBe(husband.name);
  });

  it("PATCH updates sharing and includes author in the response", async () => {
    const { husband } = await seedTwoUsers();
    const created = cardSingleResponseSchema.parse(
      await readJson(
        await createCard(
          jsonRequest("http://test/api/cards", { method: "POST", body: validPayload(husband.id) }),
        ),
      ),
    );
    const res = await patchCard(
      jsonRequest(`http://test/api/cards/${created.card.id}`, {
        method: "PATCH",
        body: { sharing: "candidate" },
      }),
      { params: { id: created.card.id } },
    );
    expect(res.status).toBe(200);
    const data = cardSingleResponseSchema.parse(await readJson(res));
    expect(data.card.sharing).toBe("candidate");
    expect(data.card.author.id).toBe(husband.id);
  });

  it("PATCH shareText sets rephrasedAt; clearing it nulls rephrasedAt", async () => {
    const { husband } = await seedTwoUsers();
    const created = cardSingleResponseSchema.parse(
      await readJson(
        await createCard(
          jsonRequest("http://test/api/cards", { method: "POST", body: validPayload(husband.id) }),
        ),
      ),
    );
    const setRes = await patchCard(
      jsonRequest(`http://test/api/cards/${created.card.id}`, {
        method: "PATCH",
        body: { shareText: "テキスト" },
      }),
      { params: { id: created.card.id } },
    );
    const set = cardSingleResponseSchema.parse(await readJson(setRes));
    expect(set.card.shareText).toBe("テキスト");
    expect(set.card.rephrasedAt).not.toBeNull();

    const clearRes = await patchCard(
      jsonRequest(`http://test/api/cards/${created.card.id}`, {
        method: "PATCH",
        body: { shareText: null },
      }),
      { params: { id: created.card.id } },
    );
    const cleared = cardSingleResponseSchema.parse(await readJson(clearRes));
    expect(cleared.card.shareText).toBeNull();
    expect(cleared.card.rephrasedAt).toBeNull();
  });

  it("DELETE removes the card", async () => {
    const { husband } = await seedTwoUsers();
    const created = cardSingleResponseSchema.parse(
      await readJson(
        await createCard(
          jsonRequest("http://test/api/cards", { method: "POST", body: validPayload(husband.id) }),
        ),
      ),
    );
    const res = await deleteCard(getRequest(`http://test/api/cards/${created.card.id}`), {
      params: { id: created.card.id },
    });
    expect(res.status).toBe(200);

    const after = await getCard(getRequest(`http://test/api/cards/${created.card.id}`), {
      params: { id: created.card.id },
    });
    expect(after.status).toBe(404);
  });
});
