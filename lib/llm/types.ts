// Shared LLM adapter contract.
// The product surface only depends on this interface — adapters can be swapped
// (xAI / Anthropic / OpenAI / template) without touching pages or API routes.

export interface RephraseInput {
  authorName: string;       // 入力者の名前 (例: "夫" / "妻")
  partnerName: string;      // 相手の名前
  title: string;            // 何があったか
  category: string;         // ラベル
  details?: string | null;  // 自由メモ (生の感情を含む)
  bearer: string;           // self | partner | both | drifted | unclear
  weight: string;           // light | moderate | heavy | very_heavy | drained
  depleted: string[];       // 削られたものリスト
  visibility: string;       // 相手に見えていたと思う？
  need: string;             // 今どうしてほしい？
}

export interface RephraseOutput {
  sharedText: string;       // 相手に見せる用の柔らかい言い換え (3〜6行)
  oneLineInsight: string;   // "今日の結論" 1行
}

export interface LlmAdapter {
  name: string;
  rephraseForShare(input: RephraseInput): Promise<RephraseOutput>;
}
