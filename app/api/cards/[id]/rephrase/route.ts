import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLlmAdapter } from "@/lib/llm";
import { CATEGORIES, DEPLETED, LOAD_TYPES, labelOf, labelsOf } from "@/lib/constants";

export async function POST(_req: Request, ctx: { params: { id: string } }) {
  const card = await prisma.burdenCard.findUnique({
    where: { id: ctx.params.id },
    include: { author: true },
  });
  if (!card) return NextResponse.json({ error: "not found" }, { status: 404 });

  const partner = await prisma.user.findFirst({
    where: { NOT: { id: card.authorId } },
    orderBy: { createdAt: "asc" },
  });

  const adapter = getLlmAdapter();
  const loadTypes = safeParseArray(card.loadTypes);
  const depleted = safeParseArray(card.depleted);
  const needs = safeParseArray(card.needs);

  try {
    const result = await adapter.rephraseForShare({
      authorName: card.author.name,
      partnerName: partner?.name ?? "相手",
      title: card.title,
      category: labelOf(CATEGORIES, card.category),
      privateText: card.privateText,
      loadTypes: labelsOf(LOAD_TYPES, loadTypes),
      bearer: card.bearer,
      weight: card.weight,
      depleted: labelsOf(DEPLETED, depleted),
      visibility: card.visibility,
      needs,
    });

    await prisma.burdenCard.update({
      where: { id: card.id },
      data: {
        shareText: result.sharedText,
        rephrasedAt: new Date(),
        appreciation: result.appreciation || null,
        selfCare: result.selfCare || null,
        adviceTip: result.adviceTip || null,
      },
    });

    return NextResponse.json({
      adapter: adapter.name,
      sharedText: result.sharedText,
      oneLineInsight: result.oneLineInsight,
      appreciation: result.appreciation,
      selfCare: result.selfCare,
      adviceTip: result.adviceTip,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown LLM error";
    return NextResponse.json({ error: msg, adapter: adapter.name }, { status: 502 });
  }
}

function safeParseArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
