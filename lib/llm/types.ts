// Shared LLM adapter contract.
// The product surface only depends on this interface — adapters can be swapped
// (xAI / Anthropic / OpenAI / template) without touching pages or API routes.

export interface RephraseInput {
  authorName: string;       // 入力者の名前 (例: "夫" / "妻")
  partnerName: string;      // 相手の名前
  title: string;            // 何があったか
  category: string;         // ラベル (CATEGORIES, single)
  privateText?: string | null; // 自由メモ (生の感情を含むことがある)
  loadTypes: string[];      // どんな種類の負担か (LOAD_TYPES labels)
  bearer: string;           // self | partner | both | drifted | unclear
  weight: string;           // light | moderate | heavy | very_heavy | drained
  depleted: string[];       // 削られたもののラベル
  visibility: string;       // 相手に見えていたと思う？
  needs: string[];          // 今どうしてほしい？ (NEEDS, multiple)
}

export interface RephraseOutput {
  sharedText: string;       // 相手に見せる用の柔らかい言い換え (3〜6行)
  oneLineInsight: string;   // "今日の結論" 1行
  appreciation: string;     // 入力者から相手への、責めを含まない労い・感謝の一言 (1〜2行)
  selfCare: string;         // 入力者自身に向けた労いの一言 (相手向けではない)
  adviceTip: string;        // 次の会話を穏やかに進めるための一言アドバイス (1行)
}

export interface LlmAdapter {
  name: string;
  rephraseForShare(input: RephraseInput): Promise<RephraseOutput>;
}
