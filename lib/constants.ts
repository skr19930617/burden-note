// All the human-facing vocabulary in one place.
// Stored as strings (not enums) so we can add new options without DB migrations.
// The purpose is not to score parenting contributions,
// but to help each person place their own burden safely.

type Option = { value: string; label: string };

// What happened (single-select). One event = one category.
export const CATEGORIES = [
  { value: "childcare", label: "子どもの世話" },
  { value: "night", label: "夜間対応" },
  { value: "meal", label: "食事・ミルク" },
  { value: "sleep", label: "寝かしつけ" },
  { value: "house", label: "家事" },
  { value: "schedule", label: "予定・段取り" },
  { value: "outside", label: "外部連絡・調整" },
  { value: "health", label: "体調・通院・服薬" },
  { value: "partner_support", label: "相手の不調時の対応" },
  { value: "emotion", label: "感情の受け止め" },
  { value: "watching", label: "見守り・待機" },
  { value: "relationship", label: "夫婦間のやりとり" },
  { value: "other", label: "その他" },
] as const;

// What KIND of burden was this (multi-select). Distinct from CATEGORIES — same event can have multiple load types.
export const LOAD_TYPES = [
  { value: "physical", label: "身体的な負担" },
  { value: "time", label: "時間を取られた" },
  { value: "sleep", label: "睡眠が削られた" },
  { value: "mental", label: "考える・判断する負担" },
  { value: "emotional", label: "感情を受け止める負担" },
  { value: "waiting", label: "待機・警戒する負担" },
  { value: "interruption", label: "中断される負担" },
  { value: "responsibility", label: "責任を背負う負担" },
  { value: "invisible", label: "見えにくい負担" },
] as const;

export const BEARERS = [
  { value: "self", label: "自分が主に担った" },
  { value: "partner", label: "相手が主に担った" },
  { value: "both", label: "2人で担った" },
  { value: "drifted", label: "気づいたら自分に乗っていた" },
  { value: "unclear", label: "どちらとも言いにくい" },
] as const;

// Word-based instead of numeric — closer to bodily experience. Never aggregate across people.
export const WEIGHTS = [
  { value: "light", label: "軽い" },
  { value: "moderate", label: "まあまあ重い" },
  { value: "heavy", label: "重い" },
  { value: "very_heavy", label: "かなり重い" },
  { value: "drained", label: "今日の余力を大きく削った" },
] as const;

// What got drained AS A RESULT (multi-select).
export const DEPLETED = [
  { value: "sleep", label: "睡眠" },
  { value: "rest", label: "休憩" },
  { value: "recovery", label: "回復する時間" },
  { value: "meal", label: "食事" },
  { value: "focus", label: "仕事/作業の集中" },
  { value: "own_time", label: "自分の時間" },
  { value: "safety", label: "安心感" },
  { value: "predictability", label: "見通し" },
  { value: "stamina", label: "体力" },
  { value: "judgment", label: "判断力" },
  { value: "emotional_room", label: "感情の余裕" },
  { value: "trust", label: "相手への信頼感" },
  { value: "self_worth", label: "自尊心" },
  { value: "loneliness", label: "孤独感が増えた" },
] as const;

export const VISIBILITY = [
  { value: "seen", label: "見えていたと思う" },
  { value: "partly", label: "少しは見えていたと思う" },
  { value: "unseen", label: "たぶん見えていなかった" },
  { value: "want_seen", label: "見えてほしかった" },
  { value: "ok_unseen", label: "見えていないままでもよい" },
] as const;

// When rendering visibility for the partner (shared dashboard / LLM context),
// soften the wording so the writer's raw plea ("見えてほしかった") doesn't read as an accusation.
export const SHARED_VISIBILITY_LABELS: Record<string, string> = {
  seen: "相手にも見えていたと思う",
  partly: "少しは見えていたと思う",
  unseen: "見えにくかったかもしれない",
  want_seen: "相手に知ってもらえると少し楽になりそう",
  ok_unseen: "今は共有しなくてもよさそう",
};

// What does the writer want done with this NOW (multi-select).
// Includes "認めてほしい" / "やわらかく声をかけてほしい" since "ありがとう" isn't always what's needed.
export const NEEDS = [
  { value: "just_know", label: "ただ知ってほしい" },
  { value: "acknowledge", label: "大変だったと認めてほしい" },
  { value: "thanks", label: "ありがとうと言ってほしい" },
  { value: "gentle_words", label: "やわらかく声をかけてほしい" },
  { value: "next_swap", label: "次回は代わってほしい" },
  { value: "change_together", label: "一緒にやり方を変えたい" },
  { value: "outsource", label: "外部に任せたい" },
  { value: "no_solve", label: "今は解決しなくていい" },
  { value: "unsure", label: "自分でもまだ分からない" },
] as const;

export const SHARING_STAGES = [
  { value: "private", label: "自分だけ保存" },
  { value: "candidate", label: "2人で見る候補にする" },
  { value: "shared", label: "共有済み" },
] as const;

// Weekly review picks — single-select. Stored by value so display labels can evolve.
export const REDUCE_TARGETS = [
  { value: "night", label: "夜間対応" },
  { value: "outside", label: "外部連絡" },
  { value: "partner_crisis", label: "相手の不調時の緊急対応" },
  { value: "house_blocked", label: "家事の詰まり" },
  { value: "rest_shortage", label: "休息不足" },
  { value: "guilt", label: "罪悪感" },
  { value: "wording", label: "夫婦間の言い方のすれ違い" },
] as const;

export const NEXT_ACTIONS = [
  { value: "change_split", label: "分担を変える" },
  { value: "ask_support", label: "外部支援に相談する" },
  { value: "define_steps", label: "手順を決める" },
  { value: "reduce_or_stop", label: "やめる/減らす" },
  { value: "say_thanks", label: "感謝を言葉にする" },
  { value: "hold", label: "今週は保留する" },
] as const;

// Helpers
export function labelOf(opts: readonly Option[], value: string): string {
  return opts.find((o) => o.value === value)?.label ?? value;
}
export function labelsOf(opts: readonly Option[], values: string[]): string[] {
  return values.map((v) => labelOf(opts, v));
}
