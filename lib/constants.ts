// All the human-facing vocabulary in one place.
// Stored as strings (not enums) so we can add new options without DB migrations.

export const CATEGORIES = [
  { value: "childcare", label: "子どもの世話" },
  { value: "night", label: "夜間・睡眠" },
  { value: "house", label: "家事" },
  { value: "outside", label: "外部連絡・調整" },
  { value: "illness", label: "体調不良時の対応" },
  { value: "emotion", label: "感情の受け止め" },
  { value: "watching", label: "見守り・待機" },
  { value: "rest_lost", label: "自分の休息が消えたこと" },
  { value: "invisible", label: "相手に見えていないと思うこと" },
  { value: "other", label: "その他" },
] as const;

export const BEARERS = [
  { value: "self", label: "自分が主に担った" },
  { value: "partner", label: "相手が主に担った" },
  { value: "both", label: "2人で担った" },
  { value: "drifted", label: "気づいたら自分に乗っていた" },
  { value: "unclear", label: "どちらとも言いにくい" },
] as const;

// Word-based instead of numeric — closer to bodily experience.
export const WEIGHTS = [
  { value: "light", label: "軽い" },
  { value: "moderate", label: "まあまあ重い" },
  { value: "heavy", label: "重い" },
  { value: "very_heavy", label: "かなり重い" },
  { value: "drained", label: "今日の余力を大きく削った" },
] as const;

export const DEPLETED = [
  { value: "sleep", label: "睡眠" },
  { value: "rest", label: "休憩" },
  { value: "meal", label: "食事" },
  { value: "focus", label: "仕事/作業の集中" },
  { value: "own_time", label: "自分の時間" },
  { value: "safety", label: "安心感" },
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

export const NEEDS = [
  { value: "just_know", label: "ただ知ってほしい" },
  { value: "thanks", label: "ありがとうと言ってほしい" },
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

// Weekly review choices — kept short on purpose.
export const REDUCE_TARGETS = [
  "夜間対応",
  "外部連絡",
  "妻の不調時の緊急対応",
  "家事の詰まり",
  "休息不足",
  "罪悪感",
  "夫婦間の言い方のすれ違い",
];

export const NEXT_ACTIONS = [
  "分担を変える",
  "外部支援に相談する",
  "手順を決める",
  "やめる/減らす",
  "感謝を言葉にする",
  "今週は保留する",
];

// Helpers
type Option = { value: string; label: string };
export function labelOf(opts: readonly Option[], value: string): string {
  return opts.find((o) => o.value === value)?.label ?? value;
}
export function labelsOf(opts: readonly Option[], values: string[]): string[] {
  return values.map((v) => labelOf(opts, v));
}
