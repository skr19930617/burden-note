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
import { AiChip, AiTooltip } from "./AiBadge";
import {
  CATEGORIES,
  LOAD_TYPES,
  BEARERS,
  WEIGHTS,
  DEPLETED,
  VISIBILITY,
  NEEDS,
} from "@/lib/constants";
import {
  useCreateCardMutation,
  useUpdateCardMutation,
} from "@/lib/store";
import type {
  Bearer,
  Category,
  Depleted,
  LoadType,
  NeedKey,
  Visibility,
  Weight,
} from "@/lib/contracts";

type Sharing = "private" | "candidate";

export type CardFormValue = {
  title: string;
  category: string;
  privateText: string;
  loadTypes: string[];
  bearer: string;
  weight: string;
  depleted: string[];
  visibility: string;
  needs: string[];
};

const EMPTY: CardFormValue = {
  title: "",
  category: "childcare",
  privateText: "",
  loadTypes: [],
  bearer: "self",
  weight: "moderate",
  depleted: [],
  visibility: "partly",
  needs: ["just_know"],
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
  const [createCard] = useCreateCardMutation();
  const [updateCard] = useUpdateCardMutation();

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
      const body = {
        title: value.title.trim(),
        category: value.category as Category,
        privateText: value.privateText.trim() || null,
        loadTypes: value.loadTypes as LoadType[],
        bearer: value.bearer as Bearer,
        weight: value.weight as Weight,
        depleted: value.depleted as Depleted[],
        visibility: value.visibility as Visibility,
        needs: value.needs as NeedKey[],
        sharing,
      };
      const card = cardId
        ? await updateCard({ id: cardId, patch: body }).unwrap()
        : await createCard({ authorId, ...body }).unwrap();
      if (!cardId) setValue(EMPTY);
      onSaved?.(card.id, sharing);
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
      <Section
        title="A. 今日しんどかったこと"
        help="1行でも複数行でも書ける。短くてもいいし、思いついたまま並べてもいい。"
      >
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={8}
          placeholder={`例)\n夜中に2回起きてミルクを作った\n寝かしつけに1時間以上かかった\n通院の予約と連絡をした`}
          value={value.title}
          onChange={(e) => patch("title", e.target.value)}
        />
        <Box sx={{ mt: 2 }}>
          <Label>カテゴリ (何が起きたか)</Label>
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
            value={value.privateText}
            onChange={(e) => patch("privateText", e.target.value)}
          />
        </Box>
      </Section>

      <Section
        title="B. どんな種類の負担だった？"
        help="同じ出来事でも、含まれる負担の種類は人によって違う。複数選べる。"
      >
        <ChipGroup
          options={LOAD_TYPES}
          value={value.loadTypes}
          onChange={(v) => patch("loadTypes", v as string[])}
          multi
        />
      </Section>

      <Section title="C. 誰が主に担った？">
        <ChipGroup
          options={BEARERS}
          value={value.bearer}
          onChange={(v) => patch("bearer", v as string)}
          help="「気づいたら自分に乗っていた」「どちらとも言いにくい」もOK。"
        />
      </Section>

      <Section title="D. 自分にとっての負担感">
        <ChipGroup
          options={WEIGHTS}
          value={value.weight}
          onChange={(v) => patch("weight", v as string)}
          help="数値ではなく、体感に近い言葉で。点数化や比較には使われない。"
        />
      </Section>

      <Section title="E. 何が削られた？" help="複数選べる。ここがこのノートの中心。">
        <ChipGroup
          options={DEPLETED}
          value={value.depleted}
          onChange={(v) => patch("depleted", v as string[])}
          multi
        />
      </Section>

      <Section title="F. 相手に見えていたと思う？">
        <ChipGroup
          options={VISIBILITY}
          value={value.visibility}
          onChange={(v) => patch("visibility", v as string)}
          help="「見えていないままでもよい」もある。"
        />
      </Section>

      <Section title="G. 今どうしてほしい？" help="複数選んでよい。解決を求めない選択肢もある。">
        <ChipGroup
          options={NEEDS}
          value={value.needs}
          onChange={(v) => patch("needs", v as string[])}
          multi
        />
      </Section>

      {error && <Alert severity="error">{error}</Alert>}

      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          mx: -2,
          px: 2,
          py: 1,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "rgba(248, 247, 244, 0.95)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          flexWrap="wrap"
          rowGap={0.75}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{ color: "text.secondary", minWidth: 0 }}
          >
            <AiChip
              label="次の画面で AI"
              tooltip="「2人で見る候補にする」を押すと共有準備の画面に進みます。そこで AI があなたの生のメモを、相手に責められた印象が出にくい表現へ整えます (生のメモは自分用に残ります)。"
            />
            <Typography variant="caption" sx={{ display: { xs: "none", sm: "inline" } }}>
              候補にすると AI が言い換えを作ります
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0 }}>
            <Button
              variant="text"
              size="small"
              disabled={saving !== null}
              onClick={() => void save("private")}
            >
              {saving === "private" ? "保存中…" : "自分だけ保存"}
            </Button>
            <AiTooltip title="押すと共有準備画面に進み、AI が責められた印象にならない表現へ整えます。">
              <Button
                variant="contained"
                size="small"
                disableElevation
                disabled={saving !== null}
                onClick={() => void save("candidate")}
              >
                {saving === "candidate" ? "保存中…" : "候補にする"}
              </Button>
            </AiTooltip>
          </Stack>
        </Stack>
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
