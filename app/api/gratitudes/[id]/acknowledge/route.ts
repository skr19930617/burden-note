import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { gratitudeAckRequestSchema, gratitudeSingleResponseSchema } from "@/lib/contracts";
import { toGratitude } from "@/lib/serialize";

export async function POST(req: Request, ctx: { params: { id: string } }) {
  let raw: unknown = {};
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }
  const parsed = gratitudeAckRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const g = await prisma.gratitude.update({
    where: { id: ctx.params.id },
    data: { acknowledgedAt: parsed.data.acked ? new Date() : null },
  });
  return NextResponse.json(
    gratitudeSingleResponseSchema.parse({ gratitude: toGratitude(g) }),
  );
}
