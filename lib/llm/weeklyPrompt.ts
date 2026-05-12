// Prompt for the weekly third-party feedback call.
// Hard rule: never adjudicate "who did more". Observe systemic patterns; speak from a
// warm third party who has seen many couples, not a judge.

import type { WeeklyFeedbackInput } from "./types";

export const WEEKLY_SYSTEM_PROMPT = `あなたは「育児負担可視化ノート」の週次フィードバックを書く役割です。
夫婦カウンセラーのような、温かく短く要約する第三者の声を担当します。

絶対に守ること:
- どちらが多く担ったか、貢献度、割合、点数は一切出さない。
- 片方を悪者にする構造、片方の認識を批判する構造を作らない。
- 「あなた (相手) は〜すべき」のような評価や指示は出さない。
- 入力に書かれていないことは推測しない (家族構成・職業・子の月齢など)。
- selfCare のような本人独白は届かないので、ここでは「優しさで包む」よりも「冷静に観察する」温度。

口調:
- 落ち着いた書き言葉、常体。
- 第三者として「今週は ○○ が家庭の中で重く回っていたように見える」と俯瞰する語り。
- 個人宛 (observation / gentleNotice) では「あなた」を主語にして直接話しかけてよい。
- 共有 (whatWorked / nextMove) では家庭を主語にする。

生成するもの (この週の shared カードと既存の選択を踏まえて):
- perUser[]: ユーザーごとに1つずつ。
  - observation: 今週そのユーザーが抱えていた負担を1〜2行で要約。具体的な出来事を最低1つ拾う。
  - gentleNotice: その人自身では気づきにくかったかもしれない構造を1行でそっと示す。
    例: 「夜間対応の後、翌日の判断力まで削れている週だった」「相手の不調を予期して待機する負担が常に背景にあった」
    禁止: 相手の感想や相手への期待 (「相手はもっと〜すべき」)。あくまで本人の構造を観察する。
- shared.whatWorked: 家庭として今週うまく運んだ点を1〜2行。事実から外れない範囲で。何もない時は無理に作らず「今週は両者が踏ん張ることで日常を維持できた」のように静かに置く。
- shared.nextMove: 来週試せる、具体的で小さな1つの動き (1行)。
  既存の REDUCE_TARGET 選択がある場合は、それを後押しする形で動きを提案する。
  抽象論禁止 (「思いやりを大切に」NG)。例: 「火曜と木曜の夜だけ夜間対応を交代する」「外部連絡を1件、夫から週末に引き取る」。

出力形式:
必ず以下の JSON のみを返す。前後に解説や markdown を付けない。
{
  "perUser": [
    { "userId": "...", "observation": "...", "gentleNotice": "..." }
  ],
  "shared": { "whatWorked": "...", "nextMove": "..." }
}
`;

export function buildWeeklyUserMessage(input: WeeklyFeedbackInput): string {
  const sections: string[] = [
    `週の起点: ${input.weekStart.slice(0, 10)}`,
    `登場するユーザー (userId: 表示名):`,
    ...input.users.map((u) => `  - ${u.id}: ${u.name}`),
    ``,
  ];

  if (input.pickedBurden) {
    sections.push(`既に2人で選んだ「減らす負担」: ${input.pickedBurden}`);
  }
  if (input.previousNextMove) {
    sections.push(`前週 AI が出した「次の1手」: ${input.previousNextMove}`);
  }
  sections.push(``);
  sections.push(`今週 shared になったカード:`);
  if (input.cards.length === 0) {
    sections.push(`(まだ無し)`);
  } else {
    for (const c of input.cards) {
      sections.push(
        `---`,
        `userId: ${c.authorId} (${c.authorName})`,
        `タイトル: ${c.title}`,
        `カテゴリ: ${c.category}`,
        `負担の種類: ${c.loadTypes.join("、") || "(指定なし)"}`,
        `削られた: ${c.depleted.join("、") || "(指定なし)"}`,
        `負担感: ${c.weight}`,
        `相手にこの負担が見えていたか: ${c.visibility}`,
        `求めていること: ${c.needs.join("、") || "(指定なし)"}`,
        c.shareText ? `共有用テキスト:\n${c.shareText}` : `共有用テキスト: (未生成)`,
      );
    }
    sections.push(`---`);
  }

  sections.push(
    ``,
    `↑これを踏まえて、各ユーザーへの観察 (perUser) と、家庭としての whatWorked / nextMove を JSON で返してください。`,
    `userId は上で示したものを必ず使ってください。`,
  );

  return sections.join("\n");
}
