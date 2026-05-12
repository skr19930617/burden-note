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
import { AiChip, AiTooltip } from "@/components/AiBadge";
import {
  CATEGORIES,
  LOAD_TYPES,
  BEARERS,
  WEIGHTS,
  DEPLETED,
  NEEDS,
  SHARED_VISIBILITY_LABELS,
  labelOf,
  labelsOf,
} from "@/lib/constants";
import {
  cardListResponseSchema,
  cardSingleResponseSchema,
  rephraseResponseSchema,
  type Card,
} from "@/lib/contracts";

type CardDetail = Card;

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
  const [appreciation, setAppreciation] = useState<string>("");
  const [selfCare, setSelfCare] = useState<string>("");
  const [adviceTip, setAdviceTip] = useState<string>("");
  const [adapter, setAdapter] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadCandidates = useCallback(async () => {
    if (!me) return;
    const qs = new URLSearchParams({ authorId: me.id, sharing: "candidate" });
    const r = await fetch(`/api/cards?${qs}`, { cache: "no-store" });
    const raw: unknown = await r.json();
    const parsed = cardListResponseSchema.parse(raw);
    setCandidates(parsed.cards);
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
      .then((raw: unknown) => {
        const parsed = cardSingleResponseSchema.parse(raw);
        const c = parsed.card;
        setActive(c);
        setDraft(c.shareText ?? "");
        setAppreciation(c.appreciation ?? "");
        setSelfCare(c.selfCare ?? "");
        setAdviceTip(c.adviceTip ?? "");
        setInsight(null);
        setError(null);
        // On first visit (right after pressing "候補にする") auto-run AI rather than wait for click.
        if (!c.shareText) {
          void runRephrase(c.id);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  async function runRephrase(cardId: string) {
    setRephrasing(true);
    setError(null);
    try {
      const r = await fetch(`/api/cards/${cardId}/rephrase`, { method: "POST" });
      const raw: unknown = await r.json();
      if (!r.ok) {
        const msg =
          typeof raw === "object" && raw !== null && "error" in raw && typeof (raw as { error: unknown }).error === "string"
            ? (raw as { error: string }).error
            : "LLM 呼び出しに失敗しました";
        throw new Error(msg);
      }
      const parsed = rephraseResponseSchema.parse(raw);
      setAdapter(parsed.adapter);
      setDraft(parsed.sharedText);
      setInsight(parsed.oneLineInsight);
      setAppreciation(parsed.appreciation);
      setSelfCare(parsed.selfCare);
      setAdviceTip(parsed.adviceTip);
    } catch (err) {
      setError(err instanceof Error ? err.message : "失敗しました");
    } finally {
      setRephrasing(false);
    }
  }

  async function rephrase() {
    if (!active) return;
    await runRephrase(active.id);
  }

  async function markShared() {
    if (!active) return;
    await fetch(`/api/cards/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sharing: "shared", shareText: draft }),
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

  const visibilityShared = SHARED_VISIBILITY_LABELS[active.visibility] ?? active.visibility;

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
        {active.privateText && (
          <Paper
            variant="outlined"
            sx={{ p: 1.5, mt: 1.5, bgcolor: "background.default", borderColor: "divider" }}
          >
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {active.privateText}
            </Typography>
          </Paper>
        )}
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
          <Chip size="small" variant="outlined" label={labelOf(CATEGORIES, active.category)} />
          {labelsOf(LOAD_TYPES, active.loadTypes).map((l) => (
            <Chip key={l} size="small" variant="outlined" label={l} />
          ))}
          <Chip size="small" variant="outlined" label={labelOf(BEARERS, active.bearer)} />
          <Chip size="small" variant="outlined" label={labelOf(WEIGHTS, active.weight)} />
          <Chip size="small" variant="outlined" label={visibilityShared} />
          {labelsOf(NEEDS, active.needs).map((l) => (
            <Chip key={l} size="small" variant="outlined" label={l} />
          ))}
        </Stack>
        {active.depleted.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            削られた: {labelsOf(DEPLETED, active.depleted).join("・")}
          </Typography>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, borderColor: "divider" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h3">共有用に整える</Typography>
            <AiChip
              tooltip="このボタンを押すと AI があなたの生のメモを読み、相手に責められた印象になりにくい表現へ整えます。生のメモ自体は変わりません。"
            />
          </Stack>
          <AiTooltip title="AI を呼び出して言い換え案を作ります。何度でも作り直せます。">
            <Button size="small" variant="outlined" onClick={rephrase} disabled={rephrasing}>
              {rephrasing ? "AI 整え中…" : draft ? "もう一度 AI で整える" : "AI で言い換える"}
            </Button>
          </AiTooltip>
        </Stack>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 1 }}
        >
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
                sx={{
                  p: 2,
                  borderColor: "rgba(184, 138, 138, 0.6)",
                  bgcolor: "rgba(184, 138, 138, 0.08)",
                }}
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
                sx={{
                  p: 2,
                  borderColor: "secondary.main",
                  bgcolor: "rgba(138, 160, 145, 0.08)",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "secondary.dark" }}>
                    相手への労いの一言
                  </Typography>
                  <AiChip
                    label="AI 提案"
                    tooltip="AI があなたの入力をもとに、相手に渡せる労いの一言を提案しました。そのまま使わなくても大丈夫。"
                  />
                </Stack>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {appreciation}
                </Typography>
              </Paper>
            )}

            {adviceTip && (
              <Paper
                variant="outlined"
                sx={{ p: 2, borderColor: "divider", bgcolor: "background.default" }}
              >
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

        <Stack
          direction="row"
          spacing={1}
          justifyContent="flex-end"
          sx={{ mt: 2 }}
        >
          <Button variant="text" size="small" onClick={backToPrivate}>
            やめる
          </Button>
          <Button
            variant="contained"
            size="small"
            disableElevation
            disabled={!draft.trim()}
            onClick={markShared}
          >
            2人で見る に出す
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
