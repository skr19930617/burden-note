import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cardPatchRequestSchema, cardSingleResponseSchema } from "@/lib/contracts";
import { toCard } from "@/lib/serialize";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const card = await prisma.burdenCard.findUnique({
    where: { id: ctx.params.id },
    include: { author: true },
  });
  if (!card) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(
    cardSingleResponseSchema.parse({ card: toCard(card, card.author) }),
  );
}

type CardUpdateData = {
  title?: string;
  category?: string;
  privateText?: string | null;
  loadTypes?: string;
  bearer?: string;
  weight?: string;
  depleted?: string;
  visibility?: string;
  needs?: string;
  sharing?: string;
  shareText?: string | null;
  rephrasedAt?: Date | null;
  occurredAt?: Date;
};

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const body: unknown = await req.json();
  const parsed = cardPatchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const data: CardUpdateData = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.category !== undefined) data.category = input.category;
  if (input.privateText !== undefined) data.privateText = input.privateText ?? null;
  if (input.loadTypes !== undefined) data.loadTypes = JSON.stringify(input.loadTypes);
  if (input.bearer !== undefined) data.bearer = input.bearer;
  if (input.weight !== undefined) data.weight = input.weight;
  if (input.depleted !== undefined) data.depleted = JSON.stringify(input.depleted);
  if (input.visibility !== undefined) data.visibility = input.visibility;
  if (input.needs !== undefined) data.needs = JSON.stringify(input.needs);
  if (input.sharing !== undefined) data.sharing = input.sharing;
  if (input.shareText !== undefined) {
    data.shareText = input.shareText ?? null;
    data.rephrasedAt = input.shareText ? new Date() : null;
  }
  if (input.occurredAt !== undefined) data.occurredAt = new Date(input.occurredAt);

  const card = await prisma.burdenCard.update({
    where: { id: ctx.params.id },
    data,
    include: { author: true },
  });
  return NextResponse.json(
    cardSingleResponseSchema.parse({ card: toCard(card, card.author) }),
  );
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  await prisma.burdenCard.delete({ where: { id: ctx.params.id } });
  return NextResponse.json({ ok: true });
}
