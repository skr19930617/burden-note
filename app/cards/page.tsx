"use client";

import { useEffect, useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useMe } from "@/components/UserContext";
import { CardListItem, type CardLite } from "@/components/CardListItem";

type Filter = "all" | "private" | "candidate" | "shared";

export default function CardsPage() {
  const me = useMe();
  const [filter, setFilter] = useState<Filter>("all");
  const [cards, setCards] = useState<CardLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!me) return;
    setLoading(true);
    const qs = new URLSearchParams({ authorId: me.id });
    if (filter !== "all") qs.set("sharing", filter);
    fetch(`/api/cards?${qs.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { cards: CardLite[] }) => setCards(d.cards))
      .finally(() => setLoading(false));
  }, [me, filter]);

  if (!me) return null;

  return (
    <Stack spacing={2}>
      <Typography variant="h2">あなたのメモ</Typography>
      <ToggleButtonGroup
        size="small"
        value={filter}
        exclusive
        onChange={(_, v: Filter | null) => v && setFilter(v)}
        sx={{ flexWrap: "wrap" }}
      >
        <ToggleButton value="all">すべて</ToggleButton>
        <ToggleButton value="private">自分だけ</ToggleButton>
        <ToggleButton value="candidate">共有候補</ToggleButton>
        <ToggleButton value="shared">共有済み</ToggleButton>
      </ToggleButtonGroup>

      {loading && (
        <Typography variant="body2" color="text.secondary">
          読み込み中…
        </Typography>
      )}
      {!loading && cards.length === 0 && (
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
            まだメモがありません。「今日」タブから書いてみてください。
          </Typography>
        </Paper>
      )}
      <Stack spacing={1}>
        {cards.map((c) => (
          <CardListItem key={c.id} card={c} />
        ))}
      </Stack>
    </Stack>
  );
}
