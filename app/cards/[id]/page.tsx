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
import {
  CATEGORIES,
  BEARERS,
  WEIGHTS,
  DEPLETED,
  VISIBILITY,
  NEEDS,
  labelOf,
  labelsOf,
} from "@/lib/constants";

type CardDetail = {
  id: string;
  title: string;
  category: string;
  details: string | null;
  bearer: string;
  weight: string;
  depleted: string[];
  visibility: string;
  need: string;
  sharing: string;
  rephrasedText: string | null;
  occurredAt: string;
  author: { id: string; name: string };
};

export default function CardDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [card, setCard] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/cards/${params.id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { card: CardDetail }) => setCard(d.card))
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

  async function setSharing(stage: "private" | "candidate" | "shared") {
    if (!card) return;
    setBusy(stage);
    const res = await fetch(`/api/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sharing: stage }),
    });
    if (res.ok) {
      const d: { card: CardDetail } = await res.json();
      setCard(d.card);
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

        {card.details && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
              メモ
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {card.details}
            </Typography>
          </Box>
        )}

        <Stack spacing={1.25} sx={{ mt: 2 }} divider={<Divider flexItem />}>
          <Row k="カテゴリ" v={labelOf(CATEGORIES, card.category)} />
          <Row k="主に担ったのは" v={labelOf(BEARERS, card.bearer)} />
          <Row k="負担感" v={labelOf(WEIGHTS, card.weight)} />
          <Row
            k="削られた"
            v={card.depleted.length ? labelsOf(DEPLETED, card.depleted).join("・") : "—"}
          />
          <Row k="相手に見えていた？" v={labelOf(VISIBILITY, card.visibility)} />
          <Row k="今どうしてほしい" v={labelOf(NEEDS, card.need)} />
        </Stack>
      </Paper>

      {card.rephrasedText && (
        <Paper variant="outlined" sx={{ p: 3, borderColor: "divider" }}>
          <Typography variant="h3">共有用に整えた文</Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
            {card.rephrasedText}
          </Typography>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ p: 3, borderColor: "divider" }}>
        <Typography variant="h3" sx={{ mb: 1 }}>
          共有の状態
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {(["private", "candidate", "shared"] as const).map((stage) => (
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
          <Button
            component={Link}
            href={`/share?card=${card.id}`}
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
          >
            共有用に整える
          </Button>
        )}
      </Paper>
    </Stack>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography variant="caption" color="text.secondary">
        {k}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {v}
      </Typography>
    </Stack>
  );
}
