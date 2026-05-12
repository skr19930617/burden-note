import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CATEGORIES, LOAD_TYPES, REDUCE_TARGETS, labelOf } from "@/lib/constants";

// Returns per-week aggregates for the dashboard charts. Never returns "who did more"
// — only family-level totals and side-by-side per-user gratitude counts.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const weeks = Math.min(Math.max(parseInt(url.searchParams.get("weeks") || "8", 10), 1), 26);

  // Compute the start of the current week (Mon 00:00).
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

  const weekKeys: string[] = [];
  for (let i = 0; i < weeks; i++) {
    const d = new Date(earliestStart.getTime() + i * 7 * 86400 * 1000);
    weekKeys.push(d.toISOString());
  }

  // Reduce-burden tracker: for each week, take the picked burden if any, and find
  // the *next* week's load-type intensity for that same reduce target. We just expose
  // the picked value + the burden carried that week as load-type-weighted sum to keep things simple.
  const reduceSeries = weekKeys.map((wk) => {
    const wkDate = new Date(wk);
    const pick = picks.find((p) => sameWeek(p.weekStart, wkDate));
    const target = pick?.pickedBurden ?? null;
    const targetLoadType = targetToLoadType(target);
    const cards = cardsInWeek(allCards, wkDate);
    const intensity = targetLoadType
      ? cards.reduce((acc, c) => {
          const lt = safeParseArray(c.loadTypes);
          return lt.includes(targetLoadType) ? acc + weightScore(c.weight) : acc;
        }, 0)
      : 0;
    return {
      weekStart: wk,
      pickedBurden: target,
      pickedBurdenLabel: target ? labelOf(REDUCE_TARGETS, target) : null,
      intensity,
    };
  });

  // Visibility ratio: % of shared cards in week marked unseen or want_seen.
  const visibilitySeries = weekKeys.map((wk) => {
    const wkDate = new Date(wk);
    const cards = cardsInWeek(allCards, wkDate);
    const total = cards.length;
    const invisible = cards.filter(
      (c) => c.visibility === "unseen" || c.visibility === "want_seen",
    ).length;
    return {
      weekStart: wk,
      total,
      invisible,
      ratio: total === 0 ? null : invisible / total,
    };
  });

  // Gratitude: per-user "ack'd received" counts (only ack'd rows feed the line).
  const gratitudeSeries = weekKeys.map((wk) => {
    const wkDate = new Date(wk);
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
    return { weekStart: wk, perUser };
  });

  return NextResponse.json({
    weeks: weekKeys,
    users: users.map((u) => ({ id: u.id, name: u.name })),
    reduceSeries,
    visibilitySeries,
    gratitudeSeries,
    // also expose all categories/loadTypes labels so the client doesn't need to import
    referenceLabels: {
      categories: CATEGORIES,
      loadTypes: LOAD_TYPES,
    },
  });
}

function safeParseArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function weightScore(w: string): number {
  return ({ light: 1, moderate: 2, heavy: 3, very_heavy: 4, drained: 5 } as Record<string, number>)[w] ?? 2;
}

// Map a REDUCE_TARGETS value to the closest LOAD_TYPES value (best-effort).
function targetToLoadType(target: string | null): string | null {
  if (!target) return null;
  return ({
    night: "sleep",
    outside: "mental",
    partner_crisis: "emotional",
    house_blocked: "interruption",
    rest_shortage: "physical",
    guilt: "invisible",
    wording: "emotional",
  } as Record<string, string>)[target] ?? null;
}

function startOfWeekMondayUTC(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay(); // 0=Sun..6=Sat
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
