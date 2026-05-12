import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cardPatchSchema } from "@/lib/validation";

const JSON_ARRAY_FIELDS = ["loadTypes", "depleted", "needs"] as const;

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const card = await prisma.burdenCard.findUnique({
    where: { id: ctx.params.id },
    include: { author: true },
  });
  if (!card) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ card: toApiCard(card) });
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const body = await req.json();
  const parsed = cardPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const data: Record<string, unknown> = {};
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
  });
  return NextResponse.json({ card: toApiCard(card) });
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  await prisma.burdenCard.delete({ where: { id: ctx.params.id } });
  return NextResponse.json({ ok: true });
}

function toApiCard<T extends Record<string, unknown>>(card: T): T {
  const out: Record<string, unknown> = { ...card };
  for (const f of JSON_ARRAY_FIELDS) {
    out[f] = safeParseArray(card[f]);
  }
  return out as T;
}

function safeParseArray(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
