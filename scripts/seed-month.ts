// Populate the local SQLite DB with ~4 weeks of realistic burden-note activity
// so charts, the weekly feedback, and the gratitude inbox all have something
// meaningful to render.
//
// Run:  npm run seed:month
//
// This deletes existing BurdenCard / WeeklyPick / WeeklyFeedback / Gratitude rows
// and rewrites them from scratch. Users are preserved (or created if missing).

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.BURDEN_DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

type CardSeed = {
  weekIdx: number;      // 0..3, where 0 = oldest (3 weeks ago)
  dayOffset: number;    // 0..6 day within the week
  hour?: number;        // hour-of-day, default 22
  authorIdx: 0 | 1;     // 0 = husband, 1 = wife
  title: string;
  category: string;
  loadTypes: string[];
  bearer: string;
  weight: string;
  depleted: string[];
  visibility: string;
  needs: string[];
  sharing?: "private" | "candidate" | "shared";
  privateText?: string;
  shareText?: string;
  appreciation?: string;
  selfCare?: string;
  adviceTip?: string;
};

type WeeklyPickSeed = {
  weekIdx: number;
  pickedBurden: string;
  nextAction?: string | null;
  note?: string | null;
  whatWorked?: string | null;
  nextMove?: string | null;
};

type GratitudeSeed = {
  weekIdx: number;
  dayOffset: number;
  hour?: number;
  fromIdx: 0 | 1;
  toIdx: 0 | 1;
  text: string;
  source?: "button" | "ai_draft" | "manual";
  acked?: boolean;
  cardKey?: string; // optional reference (unused — keeps shape readable)
};

function mondayOfThisWeekUTC(now: Date): Date {
  const d = new Date(now);
  const day = (d.getUTCDay() + 6) % 7; // Monday=0
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function dateFor(weekStart: Date, dayOffset: number, hour = 22): Date {
  const d = new Date(weekStart);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  // Ensure two users.
  let users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  if (users.length < 2) {
    await prisma.user.createMany({
      data: [
        { name: "夫", color: "#5b7a9a" },
        { name: "妻", color: "#b88a8a" },
      ],
    });
    users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  }
  const [husband, wife] = users;
  console.log(`[seed] users: ${husband.name} / ${wife.name}`);

  // Clear data tables (preserve users).
  await prisma.gratitude.deleteMany();
  await prisma.weeklyFeedback.deleteMany();
  await prisma.weeklyPick.deleteMany();
  await prisma.burdenCard.deleteMany();
  console.log("[seed] cleared cards / picks / feedback / gratitudes");

  // Compute four week-start dates (oldest=weekIdx 0, current=weekIdx 3).
  const today = new Date();
  const currentMonday = mondayOfThisWeekUTC(today);
  const weekStarts = [3, 2, 1, 0].map((delta) => {
    const d = new Date(currentMonday);
    d.setUTCDate(d.getUTCDate() - delta * 7);
    return d;
  });
  console.log(
    `[seed] weeks: ${weekStarts.map((d) => d.toISOString().slice(0, 10)).join(", ")}`,
  );

  // ── Cards ───────────────────────────────────────────────────────────────
  const cards: CardSeed[] = [
    // ─── Week 0 (3 weeks ago) — heavy, low visibility ─────────────────────
    {
      weekIdx: 0,
      dayOffset: 0,
      authorIdx: 1, // wife
      title: "赤ちゃんの泣き声で家事が中断され続けた",
      category: "emotion",
      loadTypes: ["emotional", "interruption", "invisible"],
      bearer: "drifted",
      weight: "very_heavy",
      depleted: ["self_worth", "emotional_room", "focus"],
      visibility: "unseen",
      needs: ["acknowledge", "gentle_words"],
      privateText: "今日も何もできなかった気がする。母親としてダメな気がして泣きそうになった。",
      shareText:
        "赤ちゃんの泣き声に向き合いながら、家事に手が回らない時間が続いた。\n" +
        "自尊心と感情の余裕、集中まで削られて1日が終わった。\n" +
        "見えにくいけれど、確かに重かった負担だった。",
    },
    {
      weekIdx: 0,
      dayOffset: 1,
      hour: 3,
      authorIdx: 0, // husband
      title: "夜中の対応で2時間眠れず翌日もボンヤリした",
      category: "night",
      loadTypes: ["sleep", "physical", "interruption"],
      bearer: "self",
      weight: "heavy",
      depleted: ["sleep", "focus", "judgment"],
      visibility: "partly",
      needs: ["just_know", "acknowledge"],
      shareText:
        "夜中の対応で睡眠が削られ、翌日の判断力と集中もうまく戻らなかった。\n" +
        "解決を急ぐより、この負担があったことを知ってもらえると助かる。",
    },
    {
      weekIdx: 0,
      dayOffset: 2,
      authorIdx: 1,
      title: "母親失格な気がして家事の途中で手が止まった",
      category: "emotion",
      loadTypes: ["emotional", "invisible"],
      bearer: "self",
      weight: "very_heavy",
      depleted: ["self_worth", "loneliness", "trust"],
      visibility: "want_seen",
      needs: ["gentle_words", "acknowledge"],
    },
    {
      weekIdx: 0,
      dayOffset: 3,
      authorIdx: 0,
      title: "出社前に妻の様子を気にしながら仕事に向かった",
      category: "partner_support",
      loadTypes: ["mental", "waiting", "responsibility"],
      bearer: "self",
      weight: "moderate",
      depleted: ["focus", "predictability"],
      visibility: "unseen",
      needs: ["just_know"],
    },
    {
      weekIdx: 0,
      dayOffset: 5,
      authorIdx: 1,
      title: "寝かしつけに2時間かかった",
      category: "sleep",
      loadTypes: ["sleep", "waiting", "physical"],
      bearer: "self",
      weight: "heavy",
      depleted: ["sleep", "recovery", "stamina"],
      visibility: "partly",
      needs: ["acknowledge"],
    },

    // ─── Week 1 (2 weeks ago) — picking night care, mid visibility ────────
    {
      weekIdx: 1,
      dayOffset: 0,
      hour: 2,
      authorIdx: 0,
      title: "深夜の対応で連続3日目の睡眠不足",
      category: "night",
      loadTypes: ["sleep", "physical"],
      bearer: "self",
      weight: "very_heavy",
      depleted: ["sleep", "recovery", "stamina", "judgment"],
      visibility: "partly",
      needs: ["change_together", "next_swap"],
    },
    {
      weekIdx: 1,
      dayOffset: 1,
      authorIdx: 1,
      title: "訪問看護への状況説明で気が張った",
      category: "outside",
      loadTypes: ["mental", "responsibility", "emotional"],
      bearer: "self",
      weight: "moderate",
      depleted: ["focus", "emotional_room"],
      visibility: "seen",
      needs: ["thanks"],
    },
    {
      weekIdx: 1,
      dayOffset: 2,
      authorIdx: 0,
      title: "在宅中に何度も声をかけられて仕事が止まった",
      category: "watching",
      loadTypes: ["interruption", "mental"],
      bearer: "self",
      weight: "moderate",
      depleted: ["focus", "own_time"],
      visibility: "unseen",
      needs: ["just_know"],
    },
    {
      weekIdx: 1,
      dayOffset: 4,
      authorIdx: 1,
      title: "子どもが熱を出して通院した",
      category: "health",
      loadTypes: ["physical", "mental", "responsibility"],
      bearer: "self",
      weight: "heavy",
      depleted: ["stamina", "judgment", "predictability"],
      visibility: "seen",
      needs: ["just_know", "thanks"],
    },

    // ─── Week 2 (last week) — reduce kicking in, visibility improving ────
    {
      weekIdx: 2,
      dayOffset: 1,
      hour: 3,
      authorIdx: 0,
      title: "火曜の夜は自分が対応した (合意通り)",
      category: "night",
      loadTypes: ["sleep", "responsibility"],
      bearer: "self",
      weight: "moderate",
      depleted: ["sleep"],
      visibility: "seen",
      needs: ["just_know"],
      shareText:
        "火曜の夜は分担合意通り自分が対応した。睡眠が少し削れたけど、想定の範囲だった。",
    },
    {
      weekIdx: 2,
      dayOffset: 2,
      authorIdx: 1,
      title: "夫が夜間対応してくれて朝の集中が戻ってきた",
      category: "sleep",
      loadTypes: ["sleep"],
      bearer: "partner",
      weight: "light",
      depleted: ["recovery"],
      visibility: "seen",
      needs: ["thanks"],
    },
    {
      weekIdx: 2,
      dayOffset: 3,
      authorIdx: 1,
      title: "妻の体調が悪く夫が日中の家事を引き取った",
      category: "house",
      loadTypes: ["physical", "time"],
      bearer: "partner",
      weight: "light",
      depleted: ["recovery"],
      visibility: "seen",
      needs: ["thanks"],
    },
    {
      weekIdx: 2,
      dayOffset: 5,
      authorIdx: 0,
      title: "週末の予定調整で頭が回らなかった",
      category: "schedule",
      loadTypes: ["mental", "time"],
      bearer: "self",
      weight: "moderate",
      depleted: ["focus", "judgment"],
      visibility: "partly",
      needs: ["just_know"],
    },

    // ─── Week 3 (this week) — ongoing ────────────────────────────────────
    {
      weekIdx: 3,
      dayOffset: 0,
      authorIdx: 1,
      title: "週の頭から子の機嫌が悪く家事が止まりがち",
      category: "childcare",
      loadTypes: ["emotional", "interruption"],
      bearer: "drifted",
      weight: "heavy",
      depleted: ["focus", "emotional_room"],
      visibility: "partly",
      needs: ["acknowledge"],
    },
    {
      weekIdx: 3,
      dayOffset: 1,
      hour: 4,
      authorIdx: 0,
      title: "夜中の対応のあと早朝も起きてしまって睡眠不足",
      category: "night",
      loadTypes: ["sleep", "physical"],
      bearer: "self",
      weight: "heavy",
      depleted: ["sleep", "focus", "stamina"],
      visibility: "partly",
      needs: ["acknowledge"],
    },
    {
      weekIdx: 3,
      dayOffset: 2,
      authorIdx: 1,
      title: "強い口調が出てしまって自己嫌悪が残った",
      category: "relationship",
      loadTypes: ["emotional", "invisible"],
      bearer: "self",
      weight: "heavy",
      depleted: ["self_worth", "emotional_room", "trust"],
      visibility: "want_seen",
      needs: ["gentle_words", "acknowledge"],
      sharing: "candidate", // not yet shared — left in the pipeline for testing
    },

    // A private memo (one each) to test list filters.
    {
      weekIdx: 3,
      dayOffset: 3,
      authorIdx: 0,
      title: "ひとりで抱えてた疲労感をメモだけ残す",
      category: "emotion",
      loadTypes: ["invisible", "emotional"],
      bearer: "self",
      weight: "moderate",
      depleted: ["recovery", "loneliness"],
      visibility: "ok_unseen",
      needs: ["no_solve"],
      sharing: "private",
    },
  ];

  // ── Weekly picks ────────────────────────────────────────────────────────
  const picks: WeeklyPickSeed[] = [
    {
      weekIdx: 0,
      pickedBurden: "night",
      nextAction: "define_steps",
      note: "火曜と木曜の夜は夫が対応する手順を試す",
    },
    {
      weekIdx: 1,
      pickedBurden: "night",
      nextAction: "change_split",
      note: "火・木は固定して、金曜は様子を見る",
      whatWorked:
        "夜間対応の手順を決めたことで、毎晩の判断コストが少し減った週だった。",
      nextMove: "金曜の夜も状況を見て交代する。",
    },
    {
      weekIdx: 2,
      pickedBurden: "rest_shortage",
      nextAction: "reduce_or_stop",
      note: "土曜の午後はどちらかが必ず横になる",
      whatWorked:
        "夫が日中の家事を引き取れた日が複数あり、妻の回復時間が少し戻った。",
      nextMove: "土曜の午後を「片方が30分だけ横になる」枠として固定する。",
    },
    // weekIdx 3 (current) — left blank so the review UI shows the picker.
  ];

  // ── Gratitudes ──────────────────────────────────────────────────────────
  // Mix of ack'd and unack'd to make the chart meaningful.
  const gratitudes: GratitudeSeed[] = [
    // Week 0
    {
      weekIdx: 0,
      dayOffset: 6,
      fromIdx: 1, // wife → husband
      toIdx: 0,
      text: "出社前に気にかけてくれて、ありがとう。",
      source: "button",
      acked: false,
    },

    // Week 1
    {
      weekIdx: 1,
      dayOffset: 1,
      fromIdx: 0,
      toIdx: 1,
      text: "訪問看護への説明、引き受けてくれて助かった。",
      source: "ai_draft",
      acked: true,
    },
    {
      weekIdx: 1,
      dayOffset: 5,
      fromIdx: 1,
      toIdx: 0,
      text: "夜中の対応、3日連続でやってくれてありがとう。",
      source: "button",
      acked: true,
    },

    // Week 2
    {
      weekIdx: 2,
      dayOffset: 1,
      fromIdx: 1,
      toIdx: 0,
      text: "火曜の夜、対応してくれてゆっくり眠れた。ありがとう。",
      source: "ai_draft",
      acked: true,
    },
    {
      weekIdx: 2,
      dayOffset: 3,
      fromIdx: 0,
      toIdx: 1,
      text: "体調悪い中でも、子に向き合ってくれていたこと、ちゃんと見えてた。",
      source: "ai_draft",
      acked: true,
    },
    {
      weekIdx: 2,
      dayOffset: 6,
      fromIdx: 1,
      toIdx: 0,
      text: "週末の予定の段取り、頭を使ってくれていてありがとう。",
      source: "button",
      acked: false,
    },

    // Week 3
    {
      weekIdx: 3,
      dayOffset: 1,
      fromIdx: 1,
      toIdx: 0,
      text: "夜中対応のあと早朝まで一人で抱えてくれていた。ありがとう。",
      source: "ai_draft",
      acked: true,
    },
  ];

  // ── Persist ─────────────────────────────────────────────────────────────
  const authorIds = [husband.id, wife.id] as const;

  for (const c of cards) {
    const occurredAt = dateFor(weekStarts[c.weekIdx], c.dayOffset, c.hour ?? 22);
    await prisma.burdenCard.create({
      data: {
        authorId: authorIds[c.authorIdx],
        title: c.title,
        category: c.category,
        privateText: c.privateText ?? null,
        loadTypes: JSON.stringify(c.loadTypes),
        bearer: c.bearer,
        weight: c.weight,
        depleted: JSON.stringify(c.depleted),
        visibility: c.visibility,
        needs: JSON.stringify(c.needs),
        sharing: c.sharing ?? "shared",
        shareText: c.shareText ?? null,
        rephrasedAt: c.shareText ? occurredAt : null,
        appreciation: c.appreciation ?? null,
        selfCare: c.selfCare ?? null,
        adviceTip: c.adviceTip ?? null,
        occurredAt,
        createdAt: occurredAt,
        updatedAt: occurredAt,
      },
    });
  }
  console.log(`[seed] inserted ${cards.length} cards`);

  for (const p of picks) {
    await prisma.weeklyPick.create({
      data: {
        weekStart: weekStarts[p.weekIdx],
        pickedBurden: p.pickedBurden,
        nextAction: p.nextAction ?? null,
        note: p.note ?? null,
        whatWorked: p.whatWorked ?? null,
        nextMove: p.nextMove ?? null,
        createdAt: weekStarts[p.weekIdx],
      },
    });
  }
  console.log(`[seed] inserted ${picks.length} weekly picks`);

  for (const g of gratitudes) {
    const createdAt = dateFor(weekStarts[g.weekIdx], g.dayOffset, g.hour ?? 20);
    await prisma.gratitude.create({
      data: {
        fromUserId: authorIds[g.fromIdx],
        toUserId: authorIds[g.toIdx],
        text: g.text,
        source: g.source ?? "button",
        acknowledgedAt: g.acked ? new Date(createdAt.getTime() + 1000 * 60 * 60) : null,
        createdAt,
      },
    });
  }
  console.log(`[seed] inserted ${gratitudes.length} gratitudes`);

  // Print quick summary
  const counts = {
    cards: await prisma.burdenCard.count(),
    shared: await prisma.burdenCard.count({ where: { sharing: "shared" } }),
    picks: await prisma.weeklyPick.count(),
    gratitudes: await prisma.gratitude.count(),
    acked: await prisma.gratitude.count({ where: { acknowledgedAt: { not: null } } }),
  };
  console.log("[seed] summary:", counts);
  console.log(
    "[seed] done. /review and /shared should now have meaningful data; /review LLM panel is empty — press 「今週の観察を出す」 to generate.",
  );
}

main()
  .catch((e) => {
    console.error("[seed] failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
