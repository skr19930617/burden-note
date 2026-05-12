import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  gratitudeCreateRequestSchema,
  gratitudeListResponseSchema,
  gratitudeSingleResponseSchema,
} from "@/lib/contracts";
import { toGratitude } from "@/lib/serialize";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const toUserId = url.searchParams.get("toUserId");
  const fromUserId = url.searchParams.get("fromUserId");
  const sinceParam = url.searchParams.get("since");
  const onlyAcked = url.searchParams.get("acked") === "true";

  let since: Date | null = null;
  if (sinceParam) {
    const d = new Date(sinceParam);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "invalid since" }, { status: 400 });
    }
    since = d;
  }

  const where: {
    toUserId?: string;
    fromUserId?: string;
    createdAt?: { gte: Date };
    acknowledgedAt?: { not: null };
  } = {};
  if (toUserId) where.toUserId = toUserId;
  if (fromUserId) where.fromUserId = fromUserId;
  if (since) where.createdAt = { gte: since };
  if (onlyAcked) where.acknowledgedAt = { not: null };

  const gratitudes = await prisma.gratitude.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(
    gratitudeListResponseSchema.parse({
      gratitudes: gratitudes.map(toGratitude),
    }),
  );
}

export async function POST(req: Request) {
  const body: unknown = await req.json();
  const parsed = gratitudeCreateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const g = await prisma.gratitude.create({
    data: {
      fromUserId: parsed.data.fromUserId,
      toUserId: parsed.data.toUserId,
      text: parsed.data.text,
      cardId: parsed.data.cardId ?? null,
      source: parsed.data.source,
    },
  });
  return NextResponse.json(
    gratitudeSingleResponseSchema.parse({ gratitude: toGratitude(g) }),
  );
}
