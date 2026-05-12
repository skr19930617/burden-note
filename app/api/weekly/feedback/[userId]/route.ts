import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { weeklyFeedbackPatchSchema } from "@/lib/validation";

// PATCH the per-user weekly feedback (only the user's self-report fields).
export async function PATCH(
  req: Request,
  ctx: { params: { userId: string } },
) {
  const url = new URL(req.url);
  const weekStartStr = url.searchParams.get("week");
  if (!weekStartStr) {
    return NextResponse.json({ error: "week query param required" }, { status: 400 });
  }
  const weekStart = new Date(weekStartStr);
  const body = await req.json();
  const parsed = weeklyFeedbackPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const wf = await prisma.weeklyFeedback.findFirst({
    where: { weekStart, userId: ctx.params.userId },
  });
  if (!wf) {
    return NextResponse.json({ error: "no feedback row to update" }, { status: 404 });
  }
  const updated = await prisma.weeklyFeedback.update({
    where: { id: wf.id },
    data: { feltAcknowledged: parsed.data.feltAcknowledged ?? null },
  });
  return NextResponse.json({ feedback: updated });
}
