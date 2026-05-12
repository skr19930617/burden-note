"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek } from "date-fns";
import { ja } from "date-fns/locale";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { REDUCE_TARGETS, NEXT_ACTIONS, labelOf } from "@/lib/constants";
import { WeeklyFeedbackPanel } from "@/components/WeeklyFeedbackPanel";
import { WeeklyCharts } from "@/components/WeeklyCharts";
import {
  weeklyPickListResponseSchema,
  weeklyPickSingleResponseSchema,
  type WeeklyPick,
} from "@/lib/contracts";

type Pick = WeeklyPick;

const CUSTOM = "__custom__";

export default function ReviewPage() {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [pickedBurden, setPickedBurden] = useState("");
  const [customBurden, setCustomBurden] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  useEffect(() => {
    fetch("/api/weekly", { cache: "no-store" })
      .then((r) => r.json())
      .then((raw: unknown) => {
        const parsed = weeklyPickListResponseSchema.parse(raw);
        setPicks(parsed.picks);
        const current = parsed.picks.find(
          (p) => new Date(p.weekStart).toDateString() === weekStart.toDateString(),
        );
        if (current) {
          const known = REDUCE_TARGETS.find((t) => t.value === current.pickedBurden);
          if (known) {
            setPickedBurden(known.value);
          } else {
            setPickedBurden(CUSTOM);
            setCustomBurden(current.pickedBurden);
          }
          setNextAction(current.nextAction ?? "");
          setNote(current.note ?? "");
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    const burden = pickedBurden === CUSTOM ? customBurden.trim() : pickedBurden;
    if (!burden) return;
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/weekly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekStart: weekStart.toISOString(),
        pickedBurden: burden,
        nextAction: nextAction || null,
        note: note || null,
      }),
    });
    if (res.ok) {
      const raw: unknown = await res.json();
      const parsed = weeklyPickSingleResponseSchema.parse(raw);
      setPicks((prev) => {
        const others = prev.filter(
          (p) => new Date(p.weekStart).toDateString() !== weekStart.toDateString(),
        );
        return [parsed.pick, ...others].sort(
          (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime(),
        );
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h2">今週のふりかえり</Typography>
        <Typography variant="caption" color="text.secondary">
          {format(weekStart, "yyyy/M/d (E)", { locale: ja })} の週。減らす負担は1つだけ選ぶ。
        </Typography>
      </Box>

      <WeeklyFeedbackPanel weekStart={weekStart.toISOString()} />

      <WeeklyCharts weeks={8} />

      <Paper variant="outlined" sx={{ p: 3, borderColor: "divider" }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              減らす価値が一番高い負担はどれ？
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {REDUCE_TARGETS.map((t) => (
                <Chip
                  key={t.value}
                  label={t.label}
                  onClick={() => setPickedBurden(t.value)}
                  color={pickedBurden === t.value ? "primary" : "default"}
                  variant={pickedBurden === t.value ? "filled" : "outlined"}
                />
              ))}
              <Chip
                label="自分で書く"
                onClick={() => setPickedBurden(CUSTOM)}
                color={pickedBurden === CUSTOM ? "primary" : "default"}
                variant={pickedBurden === CUSTOM ? "filled" : "outlined"}
              />
            </Stack>
            {pickedBurden === CUSTOM && (
              <TextField
                fullWidth
                size="small"
                sx={{ mt: 1.5 }}
                placeholder="例) 訪問看護への説明"
                value={customBurden}
                onChange={(e) => setCustomBurden(e.target.value)}
              />
            )}
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              次の行動を1つだけ
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {NEXT_ACTIONS.map((a) => (
                <Chip
                  key={a.value}
                  label={a.label}
                  onClick={() => setNextAction(a.value)}
                  color={nextAction === a.value ? "primary" : "default"}
                  variant={nextAction === a.value ? "filled" : "outlined"}
                />
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              メモ (任意)
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="決めたことを忘れないように1行"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Box>

          <Stack direction="row" alignItems="center" spacing={2}>
            <Button
              variant="contained"
              onClick={save}
              disabled={
                saving ||
                !(pickedBurden && (pickedBurden !== CUSTOM || customBurden.trim()))
              }
            >
              {saving ? "保存中…" : "今週の選択を保存"}
            </Button>
            {saved && (
              <Typography variant="caption" color="success.main">
                保存しました
              </Typography>
            )}
          </Stack>
        </Stack>
      </Paper>

      {picks.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3, borderColor: "divider" }}>
          <Typography variant="h3" sx={{ mb: 1.5 }}>
            これまでの選択
          </Typography>
          <Stack spacing={1}>
            {picks.map((p) => (
              <Paper
                key={p.id}
                variant="outlined"
                sx={{ p: 1.5, borderColor: "divider" }}
              >
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(p.weekStart), "yyyy/M/d", { locale: ja })} の週
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.25 }}>
                  {labelOf(REDUCE_TARGETS, p.pickedBurden)}
                  {p.nextAction && (
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      → {labelOf(NEXT_ACTIONS, p.nextAction)}
                    </Typography>
                  )}
                </Typography>
                {p.note && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    {p.note}
                  </Typography>
                )}
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
