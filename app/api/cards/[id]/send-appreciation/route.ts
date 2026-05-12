import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { gratitudeSingleResponseSchema, sendAppreciationRequestSchema } from "@/lib/contracts";
import { toGratitude } from "@/lib/serialize";

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const body: unknown = await req.json();
  const parsed = sendAppreciationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const card = await prisma.burdenCard.findUnique({
    where: { id: ctx.params.id },
    include: { author: true },
  });
  if (!card) return NextResponse.json({ error: "card not found" }, { status: 404 });

  const partner = await prisma.user.findFirst({
    where: { NOT: { id: card.authorId } },
    orderBy: { createdAt: "asc" },
  });
  if (!partner) {
    return NextResponse.json({ error: "partner user not found" }, { status: 400 });
  }

  const g = await prisma.gratitude.create({
    data: {
      fromUserId: card.authorId,
      toUserId: partner.id,
      text: parsed.data.text,
      cardId: card.id,
      source: "ai_draft",
    },
  });
  return NextResponse.json(
    gratitudeSingleResponseSchema.parse({ gratitude: toGratitude(g) }),
  );
}
