import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Toggle ack. The receiver toggles this when they actually feel it landed.
export async function POST(req: Request, ctx: { params: { id: string } }) {
  let body: { acked?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const acked = body.acked ?? true;
  const g = await prisma.gratitude.update({
    where: { id: ctx.params.id },
    data: { acknowledgedAt: acked ? new Date() : null },
  });
  return NextResponse.json({ gratitude: g });
}
