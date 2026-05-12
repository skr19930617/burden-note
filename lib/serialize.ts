// Server-side serializers that turn Prisma model instances into the wire-format
// objects defined in lib/contracts. Each one ends with a runtime parse against the
// schema so any drift between DB and contract surfaces as a 500 in development
// rather than silent data corruption.

import {
  cardSchema,
  gratitudeSchema,
  insightsResponseSchema,
  userSchema,
  userSummarySchema,
  weeklyFeedbackSchema,
  weeklyPickSchema,
  type Card,
  type Gratitude,
  type InsightsResponse,
  type User,
  type UserSummary,
  type WeeklyFeedback,
  type WeeklyPick,
} from "@/lib/contracts";

type PrismaUser = {
  id: string;
  name: string;
  color: string | null;
  createdAt: Date;
};

type PrismaBurdenCard = {
  id: string;
  authorId: string;
  title: string;
  category: string;
  privateText: string | null;
  loadTypes: string;
  bearer: string;
  weight: string;
  depleted: string;
  visibility: string;
  needs: string;
  sharing: string;
  shareText: string | null;
  rephrasedAt: Date | null;
  appreciation: string | null;
  selfCare: string | null;
  adviceTip: string | null;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
  author?: PrismaUser;
};

type PrismaGratitude = {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  cardId: string | null;
  source: string;
  acknowledgedAt: Date | null;
  createdAt: Date;
};

type PrismaWeeklyPick = {
  id: string;
  weekStart: Date;
  pickedBurden: string;
  nextAction: string | null;
  note: string | null;
  whatWorked: string | null;
  nextMove: string | null;
  createdAt: Date;
};

type PrismaWeeklyFeedback = {
  id: string;
  weekStart: Date;
  userId: string;
  observation: string;
  gentleNotice: string;
  feltAcknowledged: string | null;
  generatedAt: Date;
  user?: PrismaUser;
};

function parseJsonArray(raw: string): string[] {
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function toUser(u: PrismaUser): User {
  return userSchema.parse({
    id: u.id,
    name: u.name,
    color: u.color,
    createdAt: u.createdAt.toISOString(),
  });
}

export function toUserSummary(u: PrismaUser): UserSummary {
  return userSummarySchema.parse({
    id: u.id,
    name: u.name,
    color: u.color,
  });
}

export function toCard(c: PrismaBurdenCard, author: PrismaUser): Card {
  return cardSchema.parse({
    id: c.id,
    authorId: c.authorId,
    author: { id: author.id, name: author.name, color: author.color },
    title: c.title,
    category: c.category,
    privateText: c.privateText,
    loadTypes: parseJsonArray(c.loadTypes),
    bearer: c.bearer,
    weight: c.weight,
    depleted: parseJsonArray(c.depleted),
    visibility: c.visibility,
    needs: parseJsonArray(c.needs),
    sharing: c.sharing,
    shareText: c.shareText,
    rephrasedAt: c.rephrasedAt?.toISOString() ?? null,
    appreciation: c.appreciation,
    selfCare: c.selfCare,
    adviceTip: c.adviceTip,
    occurredAt: c.occurredAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  });
}

export function toGratitude(g: PrismaGratitude): Gratitude {
  return gratitudeSchema.parse({
    id: g.id,
    fromUserId: g.fromUserId,
    toUserId: g.toUserId,
    text: g.text,
    cardId: g.cardId,
    source: g.source,
    acknowledgedAt: g.acknowledgedAt?.toISOString() ?? null,
    createdAt: g.createdAt.toISOString(),
  });
}

export function toWeeklyPick(p: PrismaWeeklyPick): WeeklyPick {
  return weeklyPickSchema.parse({
    id: p.id,
    weekStart: p.weekStart.toISOString(),
    pickedBurden: p.pickedBurden,
    nextAction: p.nextAction,
    note: p.note,
    whatWorked: p.whatWorked,
    nextMove: p.nextMove,
    createdAt: p.createdAt.toISOString(),
  });
}

export function toWeeklyFeedback(f: PrismaWeeklyFeedback): WeeklyFeedback {
  return weeklyFeedbackSchema.parse({
    id: f.id,
    weekStart: f.weekStart.toISOString(),
    userId: f.userId,
    observation: f.observation,
    gentleNotice: f.gentleNotice,
    feltAcknowledged: f.feltAcknowledged,
    generatedAt: f.generatedAt.toISOString(),
    user: f.user ? toUserSummary(f.user) : undefined,
  });
}

export type { Card, Gratitude, InsightsResponse, User, UserSummary, WeeklyFeedback, WeeklyPick };
export { insightsResponseSchema };
