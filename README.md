# 負担の見える化ノート

ローカルで動く、夫婦の育児負担可視化ノート。
目的は採点ではなく、「見えていない負担」を見つけて、次に減らす負担を1つだけ選ぶこと。

## セットアップ

```bash
npm install
npm run db:push         # SQLite (prisma/dev.db) 作成
npm run dev             # http://localhost:3000
```

> Note: `.env` の `BURDEN_DATABASE_URL` で接続先を切ります。他プロジェクトの `DATABASE_URL` と衝突しないように専用名にしてあります。

初回アクセス時に「夫」「妻」のユーザーが自動で作成されます (名前は変更可)。

## LLM 設定 (共有用の言い換え)

xAI を既定にしつつ、アダプタ層で抽象化しています。

`.env` を編集:

```
LLM_PROVIDER=xai
XAI_API_KEY=sk-...
XAI_MODEL=grok-4-latest
```

`XAI_API_KEY` 未設定でも、`template` アダプタが簡易版の言い換えを返すのでアプリ自体は動きます。
他プロバイダ (Anthropic / OpenAI / ローカル LLM) を足す場合は `lib/llm/` にアダプタを追加し、`lib/llm/index.ts` の `getLlmAdapter()` で選択できるようにしてください。

## 構成

- `app/` — Next.js App Router (画面 + API)
- `lib/db.ts` — Prisma client
- `lib/llm/` — LLM アダプタ層 (xai / template / 拡張用)
- `lib/constants.ts` — UI 用ボキャブラリ (カテゴリ・重み・削られたもの 等)
- `prisma/schema.prisma` — DB スキーマ

## 設計原則

- 「割合」「スコア」「貢献度」は出さない
- 自分用メモ → 共有候補 → 共有済み の3段階
- 共有前に LLM が責められた印象になりにくい表現へ言い換える
- 入力体験は数値ではなく言葉ベース (体感に近い表現)
