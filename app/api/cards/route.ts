import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cardCreateSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const authorId = url.searchParams.get("authorId");
  const sharing = url.searchParams.get("sharing");
  const since = url.searchParams.get("since");

  const where: Record<string, unknown> = {};
  if (authorId) where.authorId = authorId;
  if (sharing) where.sharing = sharing;
  if (since) where.occurredAt = { gte: new Date(since) };

  const cards = await prisma.burdenCard.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    include: { author: true },
    take: 200,
  });
  return NextResponse.json({
    cards: cards.map((c) => ({
      ...c,
      depleted: safeParseArray(c.depleted),
    })),
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = cardCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;
  const card = await prisma.burdenCard.create({
    data: {
      authorId: input.authorId,
      title: input.title,
      category: input.category,
      details: input.details ?? null,
      bearer: input.bearer,
      weight: input.weight,
      depleted: JSON.stringify(input.depleted ?? []),
      visibility: input.visibility,
      need: input.need,
      sharing: input.sharing,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
    },
  });
  return NextResponse.json({
    card: { ...card, depleted: safeParseArray(card.depleted) },
  });
}

function safeParseArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
