import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { userCreateSchema } from "@/lib/validation";

export async function GET() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  // Auto-seed two empty profiles on first run so the UI has someone to be "me".
  if (users.length === 0) {
    await prisma.user.createMany({
      data: [
        { name: "夫", color: "#5b7a9a" },
        { name: "妻", color: "#b88a8a" },
      ],
    });
    const created = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({ users: created });
  }
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = userCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const user = await prisma.user.create({ data: parsed.data });
  return NextResponse.json({ user });
}
