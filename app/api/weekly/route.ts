import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { weeklyPickListResponseSchema, weeklyPickRequestSchema, weeklyPickSingleResponseSchema } from "@/lib/contracts";
import { toWeeklyPick } from "@/lib/serialize";

export async function GET() {
  const picks = await prisma.weeklyPick.findMany({
    orderBy: { weekStart: "desc" },
    take: 26,
  });
  return NextResponse.json(
    weeklyPickListResponseSchema.parse({ picks: picks.map(toWeeklyPick) }),
  );
}

export async function POST(req: Request) {
  const body: unknown = await req.json();
  const parsed = weeklyPickRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const weekStart = new Date(parsed.data.weekStart);
  const data = {
    weekStart,
    pickedBurden: parsed.data.pickedBurden,
    nextAction: parsed.data.nextAction ?? null,
    note: parsed.data.note ?? null,
  };
  const pick = await prisma.weeklyPick.upsert({
    where: { weekStart },
    update: data,
    create: data,
  });
  return NextResponse.json(
    weeklyPickSingleResponseSchema.parse({ pick: toWeeklyPick(pick) }),
  );
}
