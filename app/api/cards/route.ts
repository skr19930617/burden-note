import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  cardCreateRequestSchema,
  cardListResponseSchema,
  cardSingleResponseSchema,
  sharingSchema,
} from "@/lib/contracts";
import { toCard } from "@/lib/serialize";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const authorId = url.searchParams.get("authorId");
  const sharingParam = url.searchParams.get("sharing");
  const sinceParam = url.searchParams.get("since");

  const sharing = sharingParam ? sharingSchema.safeParse(sharingParam) : null;
  if (sharing && !sharing.success) {
    return NextResponse.json({ error: "invalid sharing" }, { status: 400 });
  }
  let since: Date | null = null;
  if (sinceParam) {
    const d = new Date(sinceParam);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "invalid since" }, { status: 400 });
    }
    since = d;
  }

  const where: {
    authorId?: string;
    sharing?: string;
    occurredAt?: { gte: Date };
  } = {};
  if (authorId) where.authorId = authorId;
  if (sharing) where.sharing = sharing.data;
  if (since) where.occurredAt = { gte: since };

  const cards = await prisma.burdenCard.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    include: { author: true },
    take: 200,
  });
  return NextResponse.json(
    cardListResponseSchema.parse({
      cards: cards.map((c) => toCard(c, c.author)),
    }),
  );
}

export async function POST(req: Request) {
  const body: unknown = await req.json();
  const parsed = cardCreateRequestSchema.safeParse(body);
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
      loadTypes: JSON.stringify(input.loadTypes),
      bearer: input.bearer,
      weight: input.weight,
      depleted: JSON.stringify(input.depleted),
      visibility: input.visibility,
      needs: JSON.stringify(input.needs),
      sharing: input.sharing,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
    },
    include: { author: true },
  });
  return NextResponse.json(
    cardSingleResponseSchema.parse({ card: toCard(card, card.author) }),
  );
}
