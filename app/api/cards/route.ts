import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cardCreateSchema } from "@/lib/validation";

const JSON_ARRAY_FIELDS = ["loadTypes", "depleted", "needs"] as const;

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
  return NextResponse.json({ cards: cards.map(toApiCard) });
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
      privateText: input.privateText ?? null,
      loadTypes: JSON.stringify(input.loadTypes ?? []),
      bearer: input.bearer,
      weight: input.weight,
      depleted: JSON.stringify(input.depleted ?? []),
      visibility: input.visibility,
      needs: JSON.stringify(input.needs ?? []),
      sharing: input.sharing,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
    },
  });
  return NextResponse.json({ card: toApiCard(card) });
}

// Expand JSON-encoded array columns into arrays for the wire format.
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
