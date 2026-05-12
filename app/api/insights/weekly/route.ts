import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CATEGORIES, LOAD_TYPES, REDUCE_TARGETS, labelOf } from "@/lib/constants";
import { insightsResponseSchema, type GratitudePoint } from "@/lib/contracts";

function parseJsonArray(raw: string): string[] {
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

function weightScore(w: string): number {
  return ({ light: 1, moderate: 2, heavy: 3, very_heavy: 4, drained: 5 } as const)[
    w as "light" | "moderate" | "heavy" | "very_heavy" | "drained"
  ] ?? 2;
}

// Map a REDUCE_TARGETS value to the closest LOAD_TYPES value (best-effort).
const REDUCE_TARGET_TO_LOAD_TYPE: Readonly<Record<string, string>> = {
  night: "sleep",
  outside: "mental",
  partner_crisis: "emotional",
  house_blocked: "interruption",
  rest_shortage: "physical",
  guilt: "invisible",
  wording: "emotional",
};

function startOfWeekMondayUTC(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay();
  const diff = (day + 6) % 7;
  x.setUTCDate(x.getUTCDate() - diff);
  return x;
}

function sameWeek(a: Date, b: Date): boolean {
  return startOfWeekMondayUTC(a).getTime() === startOfWeekMondayUTC(b).getTime();
}

function cardsInWeek<T extends { occurredAt: Date }>(cards: T[], wkStart: Date): T[] {
  const wkEnd = new Date(wkStart.getTime() + 7 * 86400 * 1000);
  return cards.filter((c) => c.occurredAt >= wkStart && c.occurredAt < wkEnd);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const weeks = Math.min(Math.max(parseInt(url.searchParams.get("weeks") || "8", 10), 1), 26);

  const now = new Date();
  const startOfThisWeek = startOfWeekMondayUTC(now);
  const earliestStart = new Date(startOfThisWeek.getTime() - (weeks - 1) * 7 * 86400 * 1000);

  const [users, allCards, picks, allGrats] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.burdenCard.findMany({
      where: { sharing: "shared", occurredAt: { gte: earliestStart } },
      orderBy: { occurredAt: "asc" },
    }),
    prisma.weeklyPick.findMany({
      where: { weekStart: { gte: earliestStart } },
      orderBy: { weekStart: "asc" },
    }),
    prisma.gratitude.findMany({
      where: { createdAt: { gte: earliestStart } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const weekStartDates: Date[] = [];
  for (let i = 0; i < weeks; i++) {
    weekStartDates.push(new Date(earliestStart.getTime() + i * 7 * 86400 * 1000));
  }

  const reduceSeries = weekStartDates.map((wkDate) => {
    const pick = picks.find((p) => sameWeek(p.weekStart, wkDate));
    const target = pick?.pickedBurden ?? null;
    const targetLoadType = target ? REDUCE_TARGET_TO_LOAD_TYPE[target] ?? null : null;
    const cards = cardsInWeek(allCards, wkDate);
    const intensity = targetLoadType
      ? cards.reduce((acc, c) => {
          const lt = parseJsonArray(c.loadTypes);
          return lt.includes(targetLoadType) ? acc + weightScore(c.weight) : acc;
        }, 0)
      : 0;
    return {
      weekStart: wkDate.toISOString(),
      pickedBurden: target,
      pickedBurdenLabel: target ? labelOf(REDUCE_TARGETS, target) : null,
      intensity,
    };
  });

  const visibilitySeries = weekStartDates.map((wkDate) => {
    const cards = cardsInWeek(allCards, wkDate);
    const total = cards.length;
    const invisible = cards.filter(
      (c) => c.visibility === "unseen" || c.visibility === "want_seen",
    ).length;
    return {
      weekStart: wkDate.toISOString(),
      total,
      invisible,
      ratio: total === 0 ? null : invisible / total,
    };
  });

  const gratitudeSeries: GratitudePoint[] = weekStartDates.map((wkDate) => {
    const wkEnd = new Date(wkDate.getTime() + 7 * 86400 * 1000);
    const inWindow = allGrats.filter(
      (g) => g.createdAt >= wkDate && g.createdAt < wkEnd,
    );
    const perUser: Record<string, { sent: number; ackReceived: number }> = {};
    for (const u of users) perUser[u.id] = { sent: 0, ackReceived: 0 };
    for (const g of inWindow) {
      if (perUser[g.fromUserId]) perUser[g.fromUserId].sent += 1;
      if (g.acknowledgedAt && perUser[g.toUserId]) {
        perUser[g.toUserId].ackReceived += 1;
      }
    }
    return { weekStart: wkDate.toISOString(), perUser };
  });

  return NextResponse.json(
    insightsResponseSchema.parse({
      weeks: weekStartDates.map((d) => d.toISOString()),
      users: users.map((u) => ({ id: u.id, name: u.name })),
      reduceSeries,
      visibilitySeries,
      gratitudeSeries,
      referenceLabels: {
        categories: CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
        loadTypes: LOAD_TYPES.map((l) => ({ value: l.value, label: l.label })),
      },
    }),
  );
}
