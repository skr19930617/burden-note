"use client";

import { useEffect, useState } from "react";
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
import { AiChip } from "@/components/AiBadge";
import {
  cardSingleResponseSchema,
  gratitudeSingleResponseSchema,
  sharingSchema,
  type Card,
  type Sharing,
} from "@/lib/contracts";

type CardDetail = Card;

export default function CardDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [card, setCard] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Sharing | null>(null);

  useEffect(() => {
    fetch(`/api/cards/${params.id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((raw: unknown) => {
        const parsed = cardSingleResponseSchema.parse(raw);
        setCard(parsed.card);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
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
    const res = await fetch(`/api/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sharing: stage }),
    });
    if (res.ok) {
      const raw: unknown = await res.json();
      const parsed = cardSingleResponseSchema.parse(raw);
      setCard(parsed.card);
    }
    setBusy(null);
  }

  async function remove() {
    if (!card) return;
    if (!confirm("このメモを削除しますか？")) return;
    await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
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

      {card.shareText && (
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
        {card.sharing === "candidate" && (
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button
              component={Link}
              href={`/share?card=${card.id}`}
              variant="contained"
              size="small"
              disableElevation
            >
              共有用に整える
            </Button>
          </Stack>
        )}
      </Paper>
    </Stack>
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
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  async function send() {
    setSending(true);
    setError(null);
    try {
      const r = await fetch(`/api/cards/${cardId}/send-appreciation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft.trim() }),
      });
      const raw: unknown = await r.json();
      if (!r.ok) {
        const msg =
          typeof raw === "object" &&
          raw !== null &&
          "error" in raw &&
          typeof (raw as { error: unknown }).error === "string"
            ? (raw as { error: string }).error
            : "送信に失敗しました";
        throw new Error(msg);
      }
      gratitudeSingleResponseSchema.parse(raw);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSending(false);
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
