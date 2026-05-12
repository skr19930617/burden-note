import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { weeklyPickSchema } from "@/lib/validation";

export async function GET() {
  const picks = await prisma.weeklyPick.findMany({
    orderBy: { weekStart: "desc" },
    take: 26,
  });
  return NextResponse.json({ picks });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = weeklyPickSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = {
    weekStart: new Date(parsed.data.weekStart),
    pickedBurden: parsed.data.pickedBurden,
    nextAction: parsed.data.nextAction ?? null,
    note: parsed.data.note ?? null,
  };
  const pick = await prisma.weeklyPick.upsert({
    where: { weekStart: data.weekStart },
    update: data,
    create: data,
  });
  return NextResponse.json({ pick });
}
