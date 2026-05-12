import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { gratitudeSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const toUserId = url.searchParams.get("toUserId");
  const fromUserId = url.searchParams.get("fromUserId");
  const since = url.searchParams.get("since");
  const onlyAcked = url.searchParams.get("acked") === "true";

  const where: Record<string, unknown> = {};
  if (toUserId) where.toUserId = toUserId;
  if (fromUserId) where.fromUserId = fromUserId;
  if (since) where.createdAt = { gte: new Date(since) };
  if (onlyAcked) where.acknowledgedAt = { not: null };

  const gratitudes = await prisma.gratitude.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ gratitudes });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = gratitudeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const g = await prisma.gratitude.create({ data: parsed.data });
  return NextResponse.json({ gratitude: g });
}
