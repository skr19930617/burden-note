"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import {
  CATEGORIES,
  LOAD_TYPES,
  BEARERS,
  WEIGHTS,
  DEPLETED,
  VISIBILITY,
  NEEDS,
  labelOf,
  labelsOf,
} from "@/lib/constants";
import { AiChip, AiTooltip } from "@/components/AiBadge";
import { sharingSchema, type Card, type Sharing } from "@/lib/contracts";
import {
  useGetCardQuery,
  useUpdateCardMutation,
  useDeleteCardMutation,
  useRephraseCardMutation,
  useSendAppreciationMutation,
} from "@/lib/store";

type CardDetail = Card;

export default function CardDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: card, isLoading } = useGetCardQuery(params.id);
  const [updateCard] = useUpdateCardMutation();
  const [deleteCard] = useDeleteCardMutation();
  const [busy, setBusy] = useState<Sharing | null>(null);

  if (isLoading) {
    return (
      <Typography variant="body2" color="text.secondary">
        読み込み中…
      </Typography>
    );
  }
  if (!card) return <Typography>見つかりませんでした。</Typography>;

  async function setSharing(stage: Sharing) {
    if (!card) return;
    setBusy(stage);
    try {
      await updateCard({ id: card.id, patch: { sharing: stage } }).unwrap();
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!card) return;
    if (!confirm("このメモを削除しますか？")) return;
    await deleteCard(card.id).unwrap();
    router.push("/cards");
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Button component={Link} href="/cards" size="small" variant="text">
          ← メモ一覧
        </Button>
        <Button size="small" color="error" variant="text" onClick={remove}>
          削除
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 3, borderColor: "divider", borderRadius: 2 }}>
        <Typography variant="h2" sx={{ mb: 0.5 }}>
          {card.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {card.author.name} / {new Date(card.occurredAt).toLocaleString("ja-JP")}
        </Typography>

        {card.privateText && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
              メモ
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {card.privateText}
            </Typography>
          </Box>
        )}

        <Stack spacing={1.25} sx={{ mt: 2 }} divider={<Divider flexItem />}>
          <Row k="カテゴリ" v={labelOf(CATEGORIES, card.category)} />
          <Row
            k="負担の種類"
            v={card.loadTypes.length ? labelsOf(LOAD_TYPES, card.loadTypes).join("・") : "—"}
          />
          <Row k="主に担ったのは" v={labelOf(BEARERS, card.bearer)} />
          <Row k="負担感" v={labelOf(WEIGHTS, card.weight)} />
          <Row
            k="削られた"
            v={card.depleted.length ? labelsOf(DEPLETED, card.depleted).join("・") : "—"}
          />
          <Row k="相手に見えていた？" v={labelOf(VISIBILITY, card.visibility)} />
          <Row
            k="今どうしてほしい"
            v={card.needs.length ? labelsOf(NEEDS, card.needs).join("・") : "—"}
          />
        </Stack>
      </Paper>

      {card.sharing === "candidate" && <ShareEditor card={card} />}

      {card.sharing === "shared" && card.shareText && (
        <Paper variant="outlined" sx={{ p: 3, borderColor: "divider" }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h3">共有用に整えた文</Typography>
            <AiChip
              label="AI 生成"
              tooltip="このテキストは AI が、あなたの生のメモから「責められた印象になりにくい表現」へ整えたものです。生のメモは上に残っています。"
            />
          </Stack>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
            {card.shareText}
          </Typography>
        </Paper>
      )}

      {card.selfCare && (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderColor: "rgba(184, 138, 138, 0.6)",
            bgcolor: "rgba(184, 138, 138, 0.08)",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h3" sx={{ color: "#8b5e5e" }}>
              自分への労いの一言
            </Typography>
            <AiChip
              label="AI 提案"
              tooltip="これは相手に送る言葉ではなく、AI から書いた本人 (あなた) への労いです。共有しなくて大丈夫。"
            />
          </Stack>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
            {card.selfCare}
          </Typography>
        </Paper>
      )}

      {card.appreciation && (
        <SendAppreciationCard cardId={card.id} appreciation={card.appreciation} />
      )}

      {card.adviceTip && (
        <Paper
          variant="outlined"
          sx={{ p: 3, borderColor: "divider", bgcolor: "background.default" }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h3">次に話すときのコツ</Typography>
            <AiChip
              label="AI 提案"
              tooltip="次に2人で話すときに穏やかに進めるための一言です。AI の提案なので、合わなければ無視して構いません。"
            />
          </Stack>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
            {card.adviceTip}
          </Typography>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ p: 3, borderColor: "divider" }}>
        <Typography variant="h3" sx={{ mb: 1 }}>
          共有の状態
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {sharingSchema.options.map((stage) => (
            <Button
              key={stage}
              variant={card.sharing === stage ? "contained" : "outlined"}
              size="small"
              disabled={busy !== null}
              onClick={() => setSharing(stage)}
            >
              {busy === stage
                ? "…"
                : stage === "private"
                ? "自分だけ"
                : stage === "candidate"
                ? "共有候補"
                : "共有済み"}
            </Button>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}

function ShareEditor({ card }: { card: CardDetail }) {
  const router = useRouter();
  const [rephraseCard, { isLoading: rephrasing }] = useRephraseCardMutation();
  const [updateCard] = useUpdateCardMutation();
  const [draft, setDraft] = useState(card.shareText ?? "");
  const [selfCare, setSelfCare] = useState(card.selfCare ?? "");
  const [appreciation, setAppreciation] = useState(card.appreciation ?? "");
  const [adviceTip, setAdviceTip] = useState(card.adviceTip ?? "");
  const [adapter, setAdapter] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"share" | "cancel" | null>(null);

  async function runRephrase() {
    setError(null);
    try {
      const result = await rephraseCard(card.id).unwrap();
      setAdapter(result.adapter);
      setDraft(result.sharedText);
      setInsight(result.oneLineInsight);
      setSelfCare(result.selfCare);
      setAppreciation(result.appreciation);
      setAdviceTip(result.adviceTip);
    } catch (err) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (() => {
              const d = (err as { data: unknown }).data;
              if (
                d &&
                typeof d === "object" &&
                "error" in d &&
                typeof (d as { error: unknown }).error === "string"
              ) {
                return (d as { error: string }).error;
              }
              return "LLM 呼び出しに失敗しました";
            })()
          : err instanceof Error
          ? err.message
          : "失敗しました";
      setError(msg);
    }
  }

  async function markShared() {
    setSubmitting("share");
    try {
      await updateCard({
        id: card.id,
        patch: { sharing: "shared", shareText: draft },
      }).unwrap();
      router.push("/shared");
    } finally {
      setSubmitting(null);
    }
  }

  async function backToPrivate() {
    setSubmitting("cancel");
    try {
      await updateCard({ id: card.id, patch: { sharing: "private" } }).unwrap();
    } finally {
      setSubmitting(null);
    }
  }

  const hasDraft = draft.trim().length > 0;

  return (
    <Paper variant="outlined" sx={{ p: 3, borderColor: "divider" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h3">共有用に整える</Typography>
          <AiChip tooltip="AI があなたの生のメモを読み、相手に責められた印象になりにくい表現へ整えます。生のメモ自体は変わりません。" />
        </Stack>
        {hasDraft && (
          <AiTooltip title="AI を呼び出して言い換え案を作ります。何度でも作り直せます。">
            <Button size="small" variant="outlined" onClick={runRephrase} disabled={rephrasing}>
              {rephrasing ? "AI 整え中…" : "もう一度 AI で整える"}
            </Button>
          </AiTooltip>
        )}
      </Stack>

      {!hasDraft ? (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            mt: 1,
            textAlign: "center",
            borderStyle: "dashed",
            borderColor: "divider",
            bgcolor: "background.default",
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
            生のメモは責められた印象になりやすいので、
            <br />
            AI に「相手に見せる用の文」を作ってもらえます。
            <br />
            作った後は自分で読み直し、手で直してから送れます。
          </Typography>
          <AiTooltip title="AI が言い換え案を作ります。何度でも作り直せます。送る前に手で直せます。">
            <span>
              <Button
                variant="contained"
                color="primary"
                disableElevation
                onClick={runRephrase}
                disabled={rephrasing}
              >
                {rephrasing ? "AI が下書きを作っています…" : "AI で言い換え案を作る"}
              </Button>
            </span>
          </AiTooltip>
        </Paper>
      ) : (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            下のテキストは AI の下書き。送る前に必ず自分で読み直して、手で直して構いません。
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={6}
            placeholder="ここに、相手に見せるテキストが入ります。AI の下書きは手で直してOK。"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        </>
      )}
      {adapter && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
          <AiChip
            label={adapter === "template" ? "AI なし" : `AI: ${adapter}`}
            tooltip={
              adapter === "template"
                ? "現在は AI を使っていません (xAI キーが未設定のため、簡易テンプレートで言い換えました)。.env に XAI_API_KEY を入れると本物の AI が動きます。"
                : `現在は ${adapter} のモデルが言い換えを生成しました。`
            }
          />
          <Typography variant="caption" color="text.secondary">
            この下書きの生成元
          </Typography>
        </Stack>
      )}
      {insight && (
        <Alert severity="info" sx={{ mt: 1.5 }}>
          {insight}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}

      {(selfCare || appreciation || adviceTip) && (
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          {selfCare && (
            <Paper
              variant="outlined"
              sx={{ p: 2, borderColor: "rgba(184, 138, 138, 0.6)", bgcolor: "rgba(184, 138, 138, 0.08)" }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#8b5e5e" }}>
                  自分への労いの一言
                </Typography>
                <AiChip
                  label="AI 提案"
                  tooltip="これは相手に送る言葉ではなく、AI から書いた本人 (あなた) への労いです。共有しなくて大丈夫。"
                />
              </Stack>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {selfCare}
              </Typography>
            </Paper>
          )}

          {appreciation && (
            <Paper
              variant="outlined"
              sx={{ p: 2, borderColor: "secondary.main", bgcolor: "rgba(138, 160, 145, 0.08)" }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "secondary.dark" }}>
                  相手への労いの一言
                </Typography>
                <AiChip
                  label="AI 提案"
                  tooltip="AI があなたの入力をもとに、相手に渡せる労いの一言を提案しました。"
                />
              </Stack>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {appreciation}
              </Typography>
            </Paper>
          )}

          {adviceTip && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: "divider", bgcolor: "background.default" }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  次に話すときのコツ
                </Typography>
                <AiChip
                  label="AI 提案"
                  tooltip="次に2人で話すときに穏やかに進めるための一言です。AI の提案なので、合わなければ無視して構いません。"
                />
              </Stack>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {adviceTip}
              </Typography>
            </Paper>
          )}
        </Stack>
      )}

      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button
          variant="text"
          size="small"
          onClick={backToPrivate}
          disabled={submitting !== null}
        >
          {submitting === "cancel" ? "…" : "やめる (自分だけに戻す)"}
        </Button>
        <Button
          variant="contained"
          size="small"
          disableElevation
          disabled={!draft.trim() || submitting !== null}
          onClick={markShared}
        >
          {submitting === "share" ? "…" : "2人で見る に出す"}
        </Button>
      </Stack>
    </Paper>
  );
}

function SendAppreciationCard({
  cardId,
  appreciation,
}: {
  cardId: string;
  appreciation: string;
}) {
  const [draft, setDraft] = useState(appreciation);
  const [sendAppreciation, { isLoading: sending }] = useSendAppreciationMutation();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  async function send() {
    setError(null);
    try {
      await sendAppreciation({ cardId, text: draft.trim() }).unwrap();
      setSent(true);
    } catch (err) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (() => {
              const d = (err as { data: unknown }).data;
              if (
                d &&
                typeof d === "object" &&
                "error" in d &&
                typeof (d as { error: unknown }).error === "string"
              ) {
                return (d as { error: string }).error;
              }
              return "送信に失敗しました";
            })()
          : err instanceof Error
          ? err.message
          : "送信に失敗しました";
      setError(msg);
    }
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        borderColor: "secondary.main",
        bgcolor: "rgba(138, 160, 145, 0.08)",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="h3" sx={{ color: "secondary.dark" }}>
          相手への労いの一言
        </Typography>
        <AiChip
          label="AI 提案"
          tooltip="AI があなたの入力をもとに、相手に渡せる労いの一言を提案しました。"
        />
      </Stack>

      {!editing ? (
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
          {draft}
        </Typography>
      ) : (
        <TextField
          fullWidth
          multiline
          minRows={3}
          sx={{ mt: 1 }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
        {!sent && (
          <Button
            size="small"
            variant="text"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? "編集をやめる" : "手で直す"}
          </Button>
        )}
        <Button
          size="small"
          variant="contained"
          color="secondary"
          disableElevation
          disabled={sending || sent || !draft.trim()}
          onClick={send}
        >
          {sent ? "送信済み" : sending ? "送信中…" : "この一言を送る"}
        </Button>
      </Stack>
    </Paper>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography variant="caption" color="text.secondary">
        {k}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, textAlign: "right" }}>
        {v}
      </Typography>
    </Stack>
  );
}
