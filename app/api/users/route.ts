import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { userCreateRequestSchema, userListResponseSchema, userSingleResponseSchema } from "@/lib/contracts";
import { toUser } from "@/lib/serialize";

export async function GET() {
  const stored = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  // Auto-seed two empty profiles on first run.
  if (stored.length === 0) {
    await prisma.user.createMany({
      data: [
        { name: "夫", color: "#5b7a9a" },
        { name: "妻", color: "#b88a8a" },
      ],
    });
    const created = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json(
      userListResponseSchema.parse({ users: created.map(toUser) }),
    );
  }
  return NextResponse.json(
    userListResponseSchema.parse({ users: stored.map(toUser) }),
  );
}

export async function POST(req: Request) {
  const body: unknown = await req.json();
  const parsed = userCreateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const user = await prisma.user.create({
    data: { name: parsed.data.name, color: parsed.data.color ?? null },
  });
  return NextResponse.json(
    userSingleResponseSchema.parse({ user: toUser(user) }),
  );
}
