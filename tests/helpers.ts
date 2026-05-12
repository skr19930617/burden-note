// Shared utilities for API contract tests.

import { prisma } from "@/lib/db";

export async function resetDb(): Promise<void> {
  // Clear all tables; preserve schema.
  await prisma.gratitude.deleteMany();
  await prisma.weeklyFeedback.deleteMany();
  await prisma.weeklyPick.deleteMany();
  await prisma.burdenCard.deleteMany();
  await prisma.user.deleteMany();
}

export type SeededUsers = {
  husband: { id: string; name: string };
  wife: { id: string; name: string };
};

export async function seedTwoUsers(): Promise<SeededUsers> {
  await prisma.user.createMany({
    data: [
      { name: "夫", color: "#5b7a9a" },
      { name: "妻", color: "#b88a8a" },
    ],
  });
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  if (users.length !== 2) {
    throw new Error("seedTwoUsers expected exactly two rows");
  }
  return {
    husband: { id: users[0].id, name: users[0].name },
    wife: { id: users[1].id, name: users[1].name },
  };
}

// Construct a Request the way Next App Router would.
export function jsonRequest(url: string, init: { method: string; body?: unknown }): Request {
  return new Request(url, {
    method: init.method,
    headers: { "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

export function getRequest(url: string): Request {
  return new Request(url, { method: "GET" });
}

export async function readJson(res: Response): Promise<unknown> {
  return res.json() as Promise<unknown>;
}
