import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { userPatchRequestSchema, userSingleResponseSchema } from "@/lib/contracts";
import { toUser } from "@/lib/serialize";

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const body: unknown = await req.json();
  const parsed = userPatchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data: { name?: string; color?: string | null } = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.color !== undefined) data.color = parsed.data.color ?? null;

  const user = await prisma.user.update({
    where: { id: ctx.params.id },
    data,
  });
  return NextResponse.json(
    userSingleResponseSchema.parse({ user: toUser(user) }),
  );
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  await prisma.user.delete({ where: { id: ctx.params.id } });
  return NextResponse.json({ ok: true });
}
