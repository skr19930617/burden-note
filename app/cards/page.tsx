"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useMe } from "@/lib/store/hooks";
import { useGetCardsQuery } from "@/lib/store";
import { CardListItem } from "@/components/CardListItem";

type Filter = "all" | "private" | "candidate";

export default function CardsPage() {
  const me = useMe();
  const [filter, setFilter] = useState<Filter>("all");
  const { data: cards = [], isLoading } = useGetCardsQuery(
    me ? { authorId: me.id, sharing: filter === "all" ? undefined : filter } : undefined,
    { skip: !me },
  );

  if (!me) return null;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h2">自分のメモ</Typography>
        <Typography variant="caption" color="text.secondary">
          書いたメモを読み返す場所。各メモを開くと「共有候補」のときだけ AI 整え画面が開きます。共有後の見え方は「2人で見る」へ。
        </Typography>
      </Box>
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
      </ToggleButtonGroup>

      {isLoading && (
        <Typography variant="body2" color="text.secondary">
          読み込み中…
        </Typography>
      )}
      {!isLoading && cards.length === 0 && (
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
            まだメモがありません。「書く」タブから入力してみてください。
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
