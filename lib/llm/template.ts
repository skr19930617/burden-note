// Fallback adapter — no API key required.
// Composes a soft share-text from the structured fields using simple templates.
// Quality is lower than LLM output but the contract is identical.

import type { LlmAdapter, RephraseInput, RephraseOutput } from "./types";

export class TemplateAdapter implements LlmAdapter {
  readonly name = "template";

  async rephraseForShare(input: RephraseInput): Promise<RephraseOutput> {
    const depleted = input.depleted.length ? input.depleted.join("・") : null;
    const bearerPhrase = bearerPhraseFor(input.bearer);
    const weightPhrase = weightPhraseFor(input.weight);
    const needPhrase = needsPhraseFor(input.needs);

    const lines: string[] = [];
    lines.push(`「${input.title}」について。`);
    if (bearerPhrase) lines.push(bearerPhrase);
    if (depleted) lines.push(`このとき削られたのは ${depleted}。`);
    lines.push(`体感としては ${weightPhrase}。`);
    if (needPhrase) lines.push(needPhrase);

    const sharedText = lines.join("\n");
    const oneLineInsight = depleted
      ? `今日の結論: 作業そのものより、${depleted} が削られたことが重かった。`
      : `今日の結論: ${input.title} が ${weightPhrase} 負担として残った。`;

    const appreciation = appreciationFor(input);
    const selfCare = selfCareFor(input);
    const adviceTip = adviceTipFor(input);

    return { sharedText, oneLineInsight, appreciation, selfCare, adviceTip };
  }
}

function bearerPhraseFor(v: string): string {
  return {
    self: "その場では主に自分が担う形になった。",
    partner: "その場では相手が主に担ってくれた。",
    both: "2人で関わった負担だった。",
    drifted: "明確な担当というより、気づいたら自分に乗っていた負担だった。",
    unclear: "どちらが担ったかは言いにくい形だった。",
  }[v] ?? "";
}

function weightPhraseFor(v: string): string {
  return {
    light: "軽め",
    moderate: "まあまあ重い",
    heavy: "重い",
    very_heavy: "かなり重い",
    drained: "今日の余力を大きく削るほど重い",
  }[v] ?? "重い";
}

function needsPhraseFor(needs: string[]): string {
  // Pick the strongest single need to keep template output short. Order = priority.
  const priority = [
    "acknowledge",
    "gentle_words",
    "just_know",
    "thanks",
    "change_together",
    "next_swap",
    "outsource",
    "no_solve",
    "unsure",
  ];
  const top = priority.find((p) => needs.includes(p)) ?? needs[0];
  if (!top) return "";
  return {
    just_know: "解決を求めているわけではなく、この負担を知ってもらえると助かる。",
    acknowledge: "解決ではなく、「大変だったね」と受け止めてもらえると助かる。",
    thanks: "解決ではなく、まず受け取ってもらえるとうれしい。",
    gentle_words: "今は強い言葉ではなく、やわらかく声をかけてもらえると助かる。",
    next_swap: "次に同じ場面が来たら代わってもらえると助かる。",
    change_together: "やり方を一緒に見直したい。",
    outsource: "2人だけで抱えず、外部の手も使いたい。",
    no_solve: "今すぐ解決しなくていい。置いておけるだけで助かる。",
    unsure: "自分でもまだどうしたいかは整理できていない。",
  }[top] ?? "";
}

function appreciationFor(input: RephraseInput): string {
  if (input.bearer === "partner" || input.bearer === "both") {
    return `${input.partnerName} がこの場面で一緒に動いてくれたことに、まずありがとうを置いておきたい。`;
  }
  return `お互いにしんどい時期、${input.partnerName} が同じ家にいてくれること自体が支えになっている。`;
}

function selfCareFor(input: RephraseInput): string {
  const depleted = input.depleted.length ? input.depleted[0] : null;
  const heavy = input.weight === "drained" || input.weight === "very_heavy";
  const who = input.authorName;
  if (depleted) {
    return heavy
      ? `${who}、ここまで ${depleted} が削れた1日を抱えてたんだね。今夜はもう、自分の身体だけにそっとやさしくしてあげてほしい。`
      : `${who}、${depleted} が削れていたのに、ちゃんと自分で気づけたんだね。それを書き残せたこと自体が、今日の自分への手当てになっている。`;
  }
  return `${who}、今日のこの負担を書き留めようと思えたこと、すでに自分への労りになってるよ。`;
}

function adviceTipFor(input: RephraseInput): string {
  if (input.needs.includes("no_solve")) return "今すぐ解決策を出さなくていい、と先に伝えてから読んでもらう。";
  if (input.needs.includes("acknowledge")) return "「大変だったね」と先に一言もらえるだけで助かると添える。";
  if (input.needs.includes("gentle_words")) return "今はやわらかい声で読んでほしい、と一文添えてから渡す。";
  if (input.needs.includes("just_know")) return "「解決してほしいわけじゃない、知ってほしい」と先に1行添える。";
  if (input.needs.includes("thanks")) return "「ありがとうと言ってほしい」とそのまま渡しても大丈夫。";
  if (input.needs.includes("next_swap")) return "「次に同じ場面が来たら代わってほしい」と具体的に1つだけ頼む。";
  if (input.needs.includes("change_together")) return "結論を出そうとせず、まず2人で30分だけ話す時間を取る提案にする。";
  return "渡す前にひと呼吸置いて、相手が読める状態かを一言確認する。";
}
