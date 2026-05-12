"use client";

import { useCallback, useEffect, useState } from "react";
import { format, startOfWeek } from "date-fns";
import { ja } from "date-fns/locale";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import { useUserContext, useMe, usePartner } from "@/components/UserContext";
import {
  CATEGORIES,
  DEPLETED,
  LOAD_TYPES,
  SHARED_VISIBILITY_LABELS,
  labelOf,
} from "@/lib/constants";

type SharedCard = {
  id: string;
  title: string;
  category: string;
  loadTypes: string[];
  bearer: string;
  weight: string;
  depleted: string[];
  visibility: string;
  needs: string[];
  shareText: string | null;
  occurredAt: string;
  author: { id: string; name: string };
};

type Gratitude = {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  source: string;
  acknowledgedAt: string | null;
  createdAt: string;
};

export default function SharedPage() {
  const { users } = useUserContext();
  const me = useMe();
  const partner = usePartner();
  const [cards, setCards] = useState<SharedCard[]>([]);
  const [gratitudes, setGratitudes] = useState<Gratitude[]>([]);
  const [loading, setLoading] = useState(true);

  const sinceIso = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

  const reload = useCallback(async () => {
    setLoading(true);
    const [c, g] = await Promise.all([
      fetch(`/api/cards?sharing=shared&since=${encodeURIComponent(sinceIso)}`, {
        cache: "no-store",
      }).then((r) => r.json()),
      fetch(`/api/gratitudes?since=${encodeURIComponent(sinceIso)}`, {
        cache: "no-store",
      }).then((r) => r.json()),
    ]);
    setCards(c.cards);
    setGratitudes(g.gratitudes);
    setLoading(false);
  }, [sinceIso]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!me) return null;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h2">2人で見る</Typography>
        <Typography variant="caption" color="text.secondary">
          {format(new Date(sinceIso), "yyyy/M/d", { locale: ja })} 〜 今日まで。
          合計の割合や採点は出しません。
        </Typography>
      </Box>

      {loading && (
        <Typography variant="body2" color="text.secondary">
          読み込み中…
        </Typography>
      )}

      {!loading && (
        <>
          <GratitudeInbox
            gratitudes={gratitudes}
            meId={me.id}
            onChanged={() => void reload()}
          />
          <HeavyLoadTypes cards={cards} />
          <ThisWeekTop cards={cards} />
          <BurdenTypeMatrix cards={cards} users={users} />
          <Invisibility cards={cards} users={users} />
          <DepletionRanking cards={cards} />
          <GratitudeCandidates
            cards={cards}
            gratitudes={gratitudes}
            meId={me.id}
            partnerId={partner?.id ?? null}
            onSaved={() => void reload()}
          />
        </>
      )}
    </Stack>
  );
}

function SectionPaper({ title, help, children }: { title: string; help?: string; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 3, borderColor: "divider" }}>
      <Typography variant="h3">{title}</Typography>
      {help && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
          {help}
        </Typography>
      )}
      <Box sx={{ mt: 1.5 }}>{children}</Box>
    </Paper>
  );
}

// 新: 「家庭として何が重いか」を LOAD_TYPES で集計する。誰が、ではなく何が、を見る。
function HeavyLoadTypes({ cards }: { cards: SharedCard[] }) {
  const counts = new Map<string, number>();
  for (const c of cards) {
    const w = weightScore(c.weight);
    for (const t of c.loadTypes) {
      counts.set(t, (counts.get(t) ?? 0) + w);
    }
  }
  const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (top.length === 0) return null;
  return (
    <SectionPaper title="今週、重かった負担タイプ" help="家庭として今、どの種類の負担が重かったか。">
      <Stack component="ol" spacing={1} sx={{ pl: 0, listStyle: "none", m: 0 }}>
        {top.map(([key], i) => (
          <Stack component="li" key={key} direction="row" alignItems="center" spacing={1.5}>
            <Box sx={countBubbleSx}>{i + 1}</Box>
            <Typography variant="body2">{labelOf(LOAD_TYPES, key)}</Typography>
          </Stack>
        ))}
      </Stack>
    </SectionPaper>
  );
}

function ThisWeekTop({ cards }: { cards: SharedCard[] }) {
  const counts = new Map<string, number>();
  for (const c of cards) {
    counts.set(c.category, (counts.get(c.category) ?? 0) + weightScore(c.weight));
  }
  const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <SectionPaper title="今週、重かった出来事" help="どんな場面が重く残ったか (誰がではなく)。">
      {top.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          まだ共有されたメモがありません。
        </Typography>
      ) : (
        <Stack component="ol" spacing={1} sx={{ pl: 0, listStyle: "none", m: 0 }}>
          {top.map(([cat], idx) => (
            <Stack key={cat} component="li" direction="row" alignItems="center" spacing={1.5}>
              <Box sx={countBubbleSx}>{idx + 1}</Box>
              <Typography variant="body2">{labelOf(CATEGORIES, cat)}</Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </SectionPaper>
  );
}

function BurdenTypeMatrix({
  cards,
  users,
}: {
  cards: SharedCard[];
  users: { id: string; name: string }[];
}) {
  // Use LOAD_TYPES as rows now — the spec says burden type, not depleted resources.
  if (cards.length === 0 || users.length === 0) return null;

  function intensity(userId: string, loadKey: string): number {
    let sum = 0;
    for (const c of cards) {
      if (c.author.id !== userId) continue;
      if (!c.loadTypes.includes(loadKey)) continue;
      sum += weightScore(c.weight);
    }
    return sum;
  }

  return (
    <SectionPaper title="負担タイプの違い" help="どちらが多いかではなく、種類が違うことを見る。">
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>負担タイプ</TableCell>
              {users.map((u) => (
                <TableCell key={u.id} align="center">
                  {u.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {LOAD_TYPES.map((r) => (
              <TableRow key={r.value}>
                <TableCell>{r.label}</TableCell>
                {users.map((u) => (
                  <TableCell key={u.id} align="center">
                    <IntensityCell value={intensity(u.id, r.value)} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </SectionPaper>
  );
}

function IntensityCell({ value }: { value: number }) {
  if (value === 0)
    return (
      <Typography component="span" variant="caption" color="text.disabled">
        —
      </Typography>
    );
  if (value >= 6) return <Chip size="small" color="primary" label="高" />;
  if (value >= 3) return <Chip size="small" color="default" label="中" />;
  return <Chip size="small" variant="outlined" label="低" />;
}

function Invisibility({
  cards,
  users,
}: {
  cards: SharedCard[];
  users: { id: string; name: string }[];
}) {
  if (cards.length === 0 || users.length < 2) return null;
  const byUser = new Map<string, SharedCard[]>();
  for (const c of cards) {
    if (c.visibility === "unseen" || c.visibility === "want_seen") {
      const list = byUser.get(c.author.id) ?? [];
      list.push(c);
      byUser.set(c.author.id, list);
    }
  }
  return (
    <SectionPaper title="見えていなかった負担" help="一番価値のあるところ。">
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ "& > *": { flex: 1 } }}
      >
        {users.map((u) => {
          const list = byUser.get(u.id) ?? [];
          const partner = users.find((x) => x.id !== u.id);
          return (
            <Paper
              key={u.id}
              variant="outlined"
              sx={{ p: 1.5, bgcolor: "background.default", borderColor: "divider" }}
            >
              <Typography variant="caption" color="text.secondary">
                {partner?.name ?? "相手"}から見えにくかった {u.name} の負担
              </Typography>
              {list.length === 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  該当なし
                </Typography>
              ) : (
                <Stack component="ul" spacing={0.5} sx={{ pl: 0, listStyle: "none", m: 0, mt: 1 }}>
                  {list.slice(0, 6).map((c) => (
                    <Typography
                      key={c.id}
                      component="li"
                      variant="body2"
                      sx={{ lineHeight: 1.5 }}
                    >
                      ・{c.title}
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                        ({SHARED_VISIBILITY_LABELS[c.visibility] ?? c.visibility})
                      </Typography>
                    </Typography>
                  ))}
                </Stack>
              )}
            </Paper>
          );
        })}
      </Stack>
    </SectionPaper>
  );
}

function DepletionRanking({ cards }: { cards: SharedCard[] }) {
  const counts = new Map<string, number>();
  for (const c of cards) {
    const w = weightScore(c.weight);
    for (const d of c.depleted) counts.set(d, (counts.get(d) ?? 0) + w);
  }
  const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (top.length === 0) return null;
  return (
    <SectionPaper title="今週、回復を削ったもの" help="作業量ではなく、回復が削られた要因。">
      <Stack component="ol" spacing={1} sx={{ pl: 0, listStyle: "none", m: 0 }}>
        {top.map(([key], i) => (
          <Stack component="li" key={key} direction="row" alignItems="center" spacing={1.5}>
            <Box sx={countBubbleSx}>{i + 1}</Box>
            <Typography variant="body2">{labelOf(DEPLETED, key)}</Typography>
          </Stack>
        ))}
      </Stack>
    </SectionPaper>
  );
}

function GratitudeCandidates({
  cards,
  gratitudes,
  meId,
  partnerId,
  onSaved,
}: {
  cards: SharedCard[];
  gratitudes: Gratitude[];
  meId: string;
  partnerId: string | null;
  onSaved: () => void;
}) {
  const suggestions = cards.filter((c) => c.author.id !== meId);
  const myThanks = gratitudes.filter((g) => g.fromUserId === meId);

  async function thank(card: SharedCard) {
    if (!partnerId) return;
    await fetch("/api/gratitudes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromUserId: meId,
        toUserId: partnerId,
        text: `「${card.title}」 ありがとう。`,
        cardId: card.id,
      }),
    });
    onSaved();
  }

  if (suggestions.length === 0 && myThanks.length === 0) return null;

  return (
    <SectionPaper
      title="ありがとう候補"
      help="負担の可視化だけだと不満の可視化になる。感謝もここに置く。"
    >
      {suggestions.length > 0 && (
        <Stack spacing={1}>
          {suggestions.slice(0, 6).map((c) => (
            <Stack
              key={c.id}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
              sx={{
                p: 1.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                bgcolor: "background.paper",
              }}
            >
              <Typography variant="body2">
                {c.author.name}: {c.title}
              </Typography>
              <Button size="small" variant="outlined" disabled={!partnerId} onClick={() => thank(c)}>
                ありがとうを送る
              </Button>
            </Stack>
          ))}
        </Stack>
      )}

      {myThanks.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            今週あなたが送った言葉
          </Typography>
          <Stack component="ul" spacing={0.5} sx={{ pl: 0, listStyle: "none", m: 0, mt: 1 }}>
            {myThanks.slice(0, 8).map((g) => (
              <Typography key={g.id} component="li" variant="body2">
                ・{g.text}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}
    </SectionPaper>
  );
}

function GratitudeInbox({
  gratitudes,
  meId,
  onChanged,
}: {
  gratitudes: Gratitude[];
  meId: string;
  onChanged: () => void;
}) {
  // Show gratitudes received by me, with an ack toggle.
  const received = gratitudes.filter((g) => g.toUserId === meId);
  if (received.length === 0) return null;

  async function setAck(g: Gratitude, acked: boolean) {
    await fetch(`/api/gratitudes/${g.id}/acknowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acked }),
    });
    onChanged();
  }

  return (
    <SectionPaper
      title="あなたに届いた言葉"
      help="相手から送られた「ありがとう」。ちゃんと届いたと感じたら「受け取った」を押してください (グラフはここをカウントします)。"
    >
      <Stack spacing={1}>
        {received.slice(0, 10).map((g) => {
          const acked = !!g.acknowledgedAt;
          return (
            <Stack
              key={g.id}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
              sx={{
                p: 1.5,
                border: "1px solid",
                borderColor: acked ? "secondary.main" : "divider",
                borderRadius: 1.5,
                bgcolor: acked ? "rgba(138, 160, 145, 0.08)" : "background.paper",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {g.text}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(g.createdAt).toLocaleString("ja-JP")}
                  {g.source === "ai_draft" && " · AI ドラフトから送信"}
                </Typography>
              </Box>
              <Button
                size="small"
                variant={acked ? "outlined" : "contained"}
                color={acked ? "secondary" : "primary"}
                disableElevation
                onClick={() => setAck(g, !acked)}
              >
                {acked ? "受け取り済み" : "受け取った"}
              </Button>
            </Stack>
          );
        })}
      </Stack>
    </SectionPaper>
  );
}

function weightScore(w: string): number {
  return ({ light: 1, moderate: 2, heavy: 3, very_heavy: 4, drained: 5 } as Record<string, number>)[w] ?? 2;
}

const countBubbleSx = {
  width: 24,
  height: 24,
  borderRadius: "50%",
  bgcolor: "background.default",
  border: "1px solid",
  borderColor: "divider",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  color: "text.secondary",
} as const;
