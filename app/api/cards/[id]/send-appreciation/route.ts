import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendAppreciationSchema } from "@/lib/validation";

// Take an AI-generated (or user-edited) appreciation line and send it as a real
// Gratitude row to the partner. Marked source="ai_draft" for later analysis.
export async function POST(req: Request, ctx: { params: { id: string } }) {
  const body = await req.json();
  const parsed = sendAppreciationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const card = await prisma.burdenCard.findUnique({
    where: { id: ctx.params.id },
    include: { author: true },
  });
  if (!card) return NextResponse.json({ error: "card not found" }, { status: 404 });

  // The appreciation flows FROM the writer TO the partner.
  const partner = await prisma.user.findFirst({
    where: { NOT: { id: card.authorId } },
    orderBy: { createdAt: "asc" },
  });
  if (!partner) return NextResponse.json({ error: "partner user not found" }, { status: 400 });

  const g = await prisma.gratitude.create({
    data: {
      fromUserId: card.authorId,
      toUserId: partner.id,
      text: parsed.data.text,
      cardId: card.id,
      source: "ai_draft",
    },
  });
  return NextResponse.json({ gratitude: g });
}
