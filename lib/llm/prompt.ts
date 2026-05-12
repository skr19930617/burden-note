// The single shared prompt used by all LLM adapters.
// Tone: never adjudicate "who is right". Restore mutual recognition.

import type { RephraseInput } from "./types";

export const SYSTEM_PROMPT = `あなたは育児負担を可視化するノートツールの「共有前の言い換え」担当です。
夫婦のどちらが多く担っているかを判定するためのツールではありません。

目的:
- 入力者が書いた生の感情を、相手に見せても責められた印象になりにくい表現へ整える
- 作業量ではなく、「何が削られたか」「見えにくかった負担」を中心に置く
- 「あなたは〜してくれなかった」のような相手主語の非難文は使わない
- 解決を急がず、まずは「この負担が確かにあった」を相手に届ける

口調:
- 落ち着いた書き言葉、敬体は使わない (常体)
- 「私が悪いと言われている」と感じさせない
- 比較・採点・割合・スコア・貢献度・正しさは一切使わない

禁止表現:
- 「○○すべき」「○○してくれない」「全部こっちが」のような断罪
- 数値での比較や評価
- "あなた" / "君" などの直接的な二人称呼称

出力:
必ず以下の JSON だけを返す。前後に説明や markdown は付けない。
{"sharedText": "...3〜6行の共有用テキスト...", "oneLineInsight": "...今日の結論1行..."}
`;

export function buildUserMessage(input: RephraseInput): string {
  const bearerJp = bearerLabel(input.bearer);
  const weightJp = weightLabel(input.weight);
  const visibilityJp = visibilityLabel(input.visibility);
  const needJp = needLabel(input.need);

  return [
    `入力者: ${input.authorName} (相手: ${input.partnerName})`,
    ``,
    `何があったか: ${input.title}`,
    `カテゴリ: ${input.category}`,
    input.details ? `本人のメモ (生の感情を含むことがある):\n---\n${input.details}\n---` : `本人のメモ: (なし)`,
    ``,
    `主に担ったのは: ${bearerJp}`,
    `本人にとっての負担感: ${weightJp}`,
    `削られたもの: ${input.depleted.length ? input.depleted.join("、") : "(指定なし)"}`,
    `相手にこの負担が見えていたと思うか: ${visibilityJp}`,
    `今どうしてほしいか: ${needJp}`,
    ``,
    `↑これを、相手に共有しても責められた印象にならない柔らかい文章に整えて、`,
    `さらに「今日の結論」を1行で添えてください。JSONのみ返してください。`,
  ].join("\n");
}

function bearerLabel(v: string) {
  return {
    self: "自分が主に担った",
    partner: "相手が主に担った",
    both: "2人で担った",
    drifted: "気づいたら自分に乗っていた",
    unclear: "どちらとも言いにくい",
  }[v] ?? v;
}

function weightLabel(v: string) {
  return {
    light: "軽い",
    moderate: "まあまあ重い",
    heavy: "重い",
    very_heavy: "かなり重い",
    drained: "今日の余力を大きく削った",
  }[v] ?? v;
}

function visibilityLabel(v: string) {
  return {
    seen: "見えていたと思う",
    partly: "少しは見えていたと思う",
    unseen: "たぶん見えていなかった",
    want_seen: "見えてほしかった",
    ok_unseen: "見えていないままでもよい",
  }[v] ?? v;
}

function needLabel(v: string) {
  return {
    just_know: "ただ知ってほしい",
    thanks: "ありがとうと言ってほしい",
    next_swap: "次回は代わってほしい",
    change_together: "一緒にやり方を変えたい",
    outsource: "外部に任せたい",
    no_solve: "今は解決しなくていい",
    unsure: "自分でもまだ分からない",
  }[v] ?? v;
}
