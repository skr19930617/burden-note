import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { userCreateSchema } from "@/lib/validation";

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const body = await req.json();
  const parsed = userCreateSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const user = await prisma.user.update({
    where: { id: ctx.params.id },
    data: parsed.data,
  });
  return NextResponse.json({ user });
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  await prisma.user.delete({ where: { id: ctx.params.id } });
  return NextResponse.json({ ok: true });
}
