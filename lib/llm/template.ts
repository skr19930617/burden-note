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
    const needPhrase = needPhraseFor(input.need);

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

    return { sharedText, oneLineInsight };
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

function needPhraseFor(v: string): string {
  return {
    just_know: "解決を求めているわけではなく、この負担を知ってもらえると助かる。",
    thanks: "解決ではなく、まず受け取ってもらえるとうれしい。",
    next_swap: "次に同じ場面が来たら代わってもらえると助かる。",
    change_together: "やり方を一緒に見直したい。",
    outsource: "2人だけで抱えず、外部の手も使いたい。",
    no_solve: "今すぐ解決しなくていい。置いておけるだけで助かる。",
    unsure: "自分でもまだどうしたいかは整理できていない。",
  }[v] ?? "";
}
