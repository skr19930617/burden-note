"use client";

import { useState } from "react";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { ChipGroup } from "./ChipGroup";
import {
  CATEGORIES,
  BEARERS,
  WEIGHTS,
  DEPLETED,
  VISIBILITY,
  NEEDS,
} from "@/lib/constants";

type Sharing = "private" | "candidate";

export type CardFormValue = {
  title: string;
  category: string;
  details: string;
  bearer: string;
  weight: string;
  depleted: string[];
  visibility: string;
  need: string;
};

const EMPTY: CardFormValue = {
  title: "",
  category: "childcare",
  details: "",
  bearer: "self",
  weight: "moderate",
  depleted: [],
  visibility: "partly",
  need: "just_know",
};

export function CardForm({
  authorId,
  onSaved,
  initial,
  cardId,
}: {
  authorId: string;
  onSaved?: (cardId: string, sharing: Sharing) => void;
  initial?: Partial<CardFormValue>;
  cardId?: string;
}) {
  const [value, setValue] = useState<CardFormValue>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState<Sharing | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch<K extends keyof CardFormValue>(k: K, v: CardFormValue[K]) {
    setValue((prev) => ({ ...prev, [k]: v }));
  }

  async function save(sharing: Sharing) {
    setError(null);
    if (!value.title.trim()) {
      setError("「今日しんどかったこと」を1行だけでも書いてみてください。");
      return;
    }
    setSaving(sharing);
    try {
      const url = cardId ? `/api/cards/${cardId}` : "/api/cards";
      const method = cardId ? "PATCH" : "POST";
      const payload = {
        ...(cardId ? {} : { authorId }),
        title: value.title.trim(),
        category: value.category,
        details: value.details.trim() || null,
        bearer: value.bearer,
        weight: value.weight,
        depleted: value.depleted,
        visibility: value.visibility,
        need: value.need,
        sharing,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`保存に失敗しました: ${body.slice(0, 200)}`);
      }
      const data = (await res.json()) as { card: { id: string } };
      if (!cardId) setValue(EMPTY);
      onSaved?.(data.card.id, sharing);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(null);
    }
  }

  return (
    <Stack
      component="form"
      spacing={2}
      onSubmit={(e) => {
        e.preventDefault();
        void save("private");
      }}
    >
      <Section title="A. 今日しんどかったこと" help="1行でいい。あとから書き足せる。">
        <TextField
          fullWidth
          size="small"
          placeholder="例) 夜中に3回起きた / 妻が泣いていて声かけを探した"
          value={value.title}
          onChange={(e) => patch("title", e.target.value)}
        />
        <Box sx={{ mt: 2 }}>
          <Label>カテゴリ</Label>
          <ChipGroup
            options={CATEGORIES}
            value={value.category}
            onChange={(v) => patch("category", v as string)}
          />
        </Box>
        <Box sx={{ mt: 2 }}>
          <Label>メモ (任意・共有時に整える元になる)</Label>
          <TextField
            fullWidth
            multiline
            minRows={4}
            placeholder="そのときの気持ちや状況をそのまま書いてOK。共有時は責められた印象にならないように言い換えます。"
            value={value.details}
            onChange={(e) => patch("details", e.target.value)}
          />
        </Box>
      </Section>

      <Section title="B. 誰が主に担った？">
        <ChipGroup
          options={BEARERS}
          value={value.bearer}
          onChange={(v) => patch("bearer", v as string)}
          help="「気づいたら自分に乗っていた」「どちらとも言いにくい」もOK。"
        />
      </Section>

      <Section title="C. 自分にとっての負担感">
        <ChipGroup
          options={WEIGHTS}
          value={value.weight}
          onChange={(v) => patch("weight", v as string)}
          help="数値ではなく、体感に近い言葉で。"
        />
      </Section>

      <Section title="D. 何が削られた？" help="複数選べる。ここがこのノートの中心。">
        <ChipGroup
          options={DEPLETED}
          value={value.depleted}
          onChange={(v) => patch("depleted", v as string[])}
          multi
        />
      </Section>

      <Section title="E. 相手に見えていたと思う？">
        <ChipGroup
          options={VISIBILITY}
          value={value.visibility}
          onChange={(v) => patch("visibility", v as string)}
          help="「見えていないままでもよい」もある。"
        />
      </Section>

      <Section title="F. 今どうしてほしい？">
        <ChipGroup
          options={NEEDS}
          value={value.need}
          onChange={(v) => patch("need", v as string)}
          help="解決を求めない選択肢もある。"
        />
      </Section>

      {error && <Alert severity="error">{error}</Alert>}

      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          mx: -2,
          px: 2,
          py: 1.5,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "rgba(248, 247, 244, 0.95)",
          backdropFilter: "blur(8px)",
          display: "flex",
          gap: 1,
        }}
      >
        <Button
          variant="outlined"
          fullWidth
          disabled={saving !== null}
          onClick={() => void save("private")}
        >
          {saving === "private" ? "保存中…" : "自分だけ保存"}
        </Button>
        <Button
          variant="contained"
          fullWidth
          disabled={saving !== null}
          onClick={() => void save("candidate")}
        >
          {saving === "candidate" ? "保存中…" : "2人で見る候補にする"}
        </Button>
      </Box>
    </Stack>
  );
}

function Section({
  title,
  help,
  children,
}: {
  title: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderColor: "divider", borderRadius: 2 }}
    >
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

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="body2"
      sx={{ color: "text.primary", fontWeight: 500, mb: 0.75 }}
    >
      {children}
    </Typography>
  );
}
