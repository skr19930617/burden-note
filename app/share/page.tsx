"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import { useMe } from "@/components/UserContext";
import { CardListItem, type CardLite } from "@/components/CardListItem";
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

type CardDetail = CardLite & {
  details: string | null;
  visibility: string;
  need: string;
  rephrasedText: string | null;
};

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <Typography variant="body2" color="text.secondary">
          読み込み中…
        </Typography>
      }
    >
      <ShareInner />
    </Suspense>
  );
}

function ShareInner() {
  const me = useMe();
  const router = useRouter();
  const params = useSearchParams();
  const focusId = params.get("card");

  const [candidates, setCandidates] = useState<CardLite[]>([]);
  const [active, setActive] = useState<CardDetail | null>(null);
  const [rephrasing, setRephrasing] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [adapter, setAdapter] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadCandidates = useCallback(async () => {
    if (!me) return;
    const qs = new URLSearchParams({ authorId: me.id, sharing: "candidate" });
    const r = await fetch(`/api/cards?${qs}`, { cache: "no-store" });
    const d: { cards: CardLite[] } = await r.json();
    setCandidates(d.cards);
  }, [me]);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  useEffect(() => {
    if (!focusId) {
      setActive(null);
      return;
    }
    fetch(`/api/cards/${focusId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { card: CardDetail }) => {
        setActive(d.card);
        setDraft(d.card.rephrasedText ?? "");
        setInsight(null);
        setError(null);
      });
  }, [focusId]);

  async function rephrase() {
    if (!active) return;
    setRephrasing(true);
    setError(null);
    try {
      const r = await fetch(`/api/cards/${active.id}/rephrase`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "LLM 呼び出しに失敗しました");
      setAdapter(d.adapter ?? null);
      setDraft(d.sharedText);
      setInsight(d.oneLineInsight);
    } catch (err) {
      setError(err instanceof Error ? err.message : "失敗しました");
    } finally {
      setRephrasing(false);
    }
  }

  async function markShared() {
    if (!active) return;
    await fetch(`/api/cards/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sharing: "shared", rephrasedText: draft }),
    });
    await loadCandidates();
    router.push("/shared");
  }

  async function backToPrivate() {
    if (!active) return;
    await fetch(`/api/cards/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sharing: "private" }),
    });
    await loadCandidates();
    router.push("/share");
  }

  if (!me) return null;

  if (!active) {
    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="h2">共有候補</Typography>
          <Typography variant="caption" color="text.secondary">
            ここで選んだメモは、共有前に責められた印象にならないよう言い換えてから「2人で見る」に出します。
          </Typography>
        </Box>
        {candidates.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              textAlign: "center",
              borderStyle: "dashed",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              共有候補のメモはありません。
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1}>
            {candidates.map((c) => (
              <CardListItem key={c.id} card={c} href={`/share?card=${c.id}`} />
            ))}
          </Stack>
        )}
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Button component={Link} href="/share" size="small" variant="text">
        ← 共有候補に戻る
      </Button>

      <Paper variant="outlined" sx={{ p: 3, borderColor: "divider" }}>
        <Typography variant="h2">{active.title}</Typography>
        <Typography variant="caption" color="text.secondary">
          {active.author.name} / {new Date(active.occurredAt).toLocaleString("ja-JP")}
        </Typography>
        {active.details && (
          <Paper
            variant="outlined"
            sx={{ p: 1.5, mt: 1.5, bgcolor: "background.default", borderColor: "divider" }}
          >
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {active.details}
            </Typography>
          </Paper>
        )}
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
          <Chip size="small" variant="outlined" label={labelOf(CATEGORIES, active.category)} />
          <Chip size="small" variant="outlined" label={labelOf(BEARERS, active.bearer)} />
          <Chip size="small" variant="outlined" label={labelOf(WEIGHTS, active.weight)} />
          <Chip size="small" variant="outlined" label={labelOf(VISIBILITY, active.visibility)} />
          <Chip size="small" variant="outlined" label={labelOf(NEEDS, active.need)} />
        </Stack>
        {active.depleted.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            削られた: {labelsOf(DEPLETED, active.depleted).join("・")}
          </Typography>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, borderColor: "divider" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h3">共有用に整える</Typography>
          <Button size="small" variant="outlined" onClick={rephrase} disabled={rephrasing}>
            {rephrasing ? "整え中…" : draft ? "もう一度整える" : "言い換える"}
          </Button>
        </Stack>
        <TextField
          fullWidth
          multiline
          minRows={6}
          placeholder="ここに、相手に見せるテキストが入ります。LLM の下書きは手で直してOK。"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        {adapter && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            言い換えに使った仕組み: <code>{adapter}</code>
            {adapter === "template" && <span> (xAI キー未設定のため簡易版)</span>}
          </Typography>
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
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button variant="outlined" fullWidth onClick={backToPrivate}>
            やめる (自分だけに戻す)
          </Button>
          <Button
            variant="contained"
            fullWidth
            disabled={!draft.trim()}
            onClick={markShared}
          >
            これを 2人で見る に出す
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
