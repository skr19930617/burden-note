import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLlmAdapter } from "@/lib/llm";
import {
  CATEGORIES,
  DEPLETED,
  LOAD_TYPES,
  NEEDS,
  VISIBILITY,
  WEIGHTS,
  labelOf,
  labelsOf,
} from "@/lib/constants";
import {
  weeklyFeedbackBundleSchema,
  weeklyFeedbackTriggerRequestSchema,
  weeklyFeedbackTriggerResponseSchema,
} from "@/lib/contracts";
import { toWeeklyFeedback, toWeeklyPick } from "@/lib/serialize";

function parseJsonArray(raw: string): string[] {
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const weekStartStr = url.searchParams.get("week");
  if (!weekStartStr) {
    return NextResponse.json({ error: "week is required (ISO date)" }, { status: 400 });
  }
  const weekStart = new Date(weekStartStr);
  if (Number.isNaN(weekStart.getTime())) {
    return NextResponse.json({ error: "invalid week date" }, { status: 400 });
  }

  const [perUser, pick] = await Promise.all([
    prisma.weeklyFeedback.findMany({
      where: { weekStart },
      include: { user: true },
    }),
    prisma.weeklyPick.findUnique({ where: { weekStart } }),
  ]);
  return NextResponse.json(
    weeklyFeedbackBundleSchema.parse({
      weekStart: weekStart.toISOString(),
      perUser: perUser.map(toWeeklyFeedback),
      pick: pick ? toWeeklyPick(pick) : null,
    }),
  );
}

export async function POST(req: Request) {
  const body: unknown = await req.json();
  const parsed = weeklyFeedbackTriggerRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const weekStart = new Date(parsed.data.weekStart);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [users, sharedCards, pick, prevPick] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.burdenCard.findMany({
      where: {
        sharing: "shared",
        occurredAt: { gte: weekStart, lt: weekEnd },
      },
      include: { author: true },
      orderBy: { occurredAt: "asc" },
    }),
    prisma.weeklyPick.findUnique({ where: { weekStart } }),
    prisma.weeklyPick.findFirst({
      where: { weekStart: { lt: weekStart } },
      orderBy: { weekStart: "desc" },
    }),
  ]);

  if (users.length === 0) {
    return NextResponse.json({ error: "no users found" }, { status: 400 });
  }

  const adapter = getLlmAdapter();

  try {
    const result = await adapter.weeklyFeedback({
      weekStart: weekStart.toISOString(),
      users: users.map((u) => ({ id: u.id, name: u.name })),
      cards: sharedCards.map((c) => ({
        authorId: c.authorId,
        authorName: c.author.name,
        title: c.title,
        category: labelOf(CATEGORIES, c.category),
        loadTypes: labelsOf(LOAD_TYPES, parseJsonArray(c.loadTypes)),
        depleted: labelsOf(DEPLETED, parseJsonArray(c.depleted)),
        visibility: labelOf(VISIBILITY, c.visibility),
        weight: labelOf(WEIGHTS, c.weight),
        needs: labelsOf(NEEDS, parseJsonArray(c.needs)),
        shareText: c.shareText,
      })),
      pickedBurden: pick?.pickedBurden ?? null,
      previousNextMove: prevPick?.nextMove ?? null,
    });

    const existing = await prisma.weeklyFeedback.findMany({ where: { weekStart } });
    const ackByUser = new Map(existing.map((e) => [e.userId, e.feltAcknowledged]));

    await prisma.$transaction([
      prisma.weeklyFeedback.deleteMany({ where: { weekStart } }),
      ...result.perUser.map((p) =>
        prisma.weeklyFeedback.create({
          data: {
            weekStart,
            userId: p.userId,
            observation: p.observation,
            gentleNotice: p.gentleNotice,
            feltAcknowledged: ackByUser.get(p.userId) ?? null,
          },
        }),
      ),
      prisma.weeklyPick.upsert({
        where: { weekStart },
        update: {
          whatWorked: result.shared.whatWorked,
          nextMove: result.shared.nextMove,
        },
        create: {
          weekStart,
          pickedBurden: pick?.pickedBurden ?? "",
          whatWorked: result.shared.whatWorked,
          nextMove: result.shared.nextMove,
        },
      }),
    ]);

    const refreshed = await prisma.weeklyFeedback.findMany({
      where: { weekStart },
      include: { user: true },
    });
    const refreshedPick = await prisma.weeklyPick.findUnique({ where: { weekStart } });

    return NextResponse.json(
      weeklyFeedbackTriggerResponseSchema.parse({
        adapter: adapter.name,
        weekStart: weekStart.toISOString(),
        perUser: refreshed.map(toWeeklyFeedback),
        pick: refreshedPick ? toWeeklyPick(refreshedPick) : null,
      }),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown LLM error";
    return NextResponse.json({ error: msg, adapter: adapter.name }, { status: 502 });
  }
}
