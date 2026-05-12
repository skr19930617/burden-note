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
import { REDUCE_TARGETS, NEXT_ACTIONS } from "@/lib/constants";

type Pick = {
  id: string;
  weekStart: string;
  pickedBurden: string;
  nextAction: string | null;
  note: string | null;
};

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
      .then((d: { picks: Pick[] }) => {
        setPicks(d.picks);
        const current = d.picks.find(
          (p) => new Date(p.weekStart).toDateString() === weekStart.toDateString(),
        );
        if (current) {
          if (REDUCE_TARGETS.includes(current.pickedBurden)) {
            setPickedBurden(current.pickedBurden);
          } else {
            setPickedBurden("__custom__");
            setCustomBurden(current.pickedBurden);
          }
          setNextAction(current.nextAction ?? "");
          setNote(current.note ?? "");
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    const burden = pickedBurden === "__custom__" ? customBurden.trim() : pickedBurden;
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
      const d: { pick: Pick } = await res.json();
      setPicks((prev) => {
        const others = prev.filter(
          (p) => new Date(p.weekStart).toDateString() !== weekStart.toDateString(),
        );
        return [d.pick, ...others].sort(
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

      <Paper variant="outlined" sx={{ p: 3, borderColor: "divider" }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              減らす価値が一番高い負担はどれ？
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {REDUCE_TARGETS.map((b) => (
                <Chip
                  key={b}
                  label={b}
                  onClick={() => setPickedBurden(b)}
                  color={pickedBurden === b ? "primary" : "default"}
                  variant={pickedBurden === b ? "filled" : "outlined"}
                />
              ))}
              <Chip
                label="自分で書く"
                onClick={() => setPickedBurden("__custom__")}
                color={pickedBurden === "__custom__" ? "primary" : "default"}
                variant={pickedBurden === "__custom__" ? "filled" : "outlined"}
              />
            </Stack>
            {pickedBurden === "__custom__" && (
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
                  key={a}
                  label={a}
                  onClick={() => setNextAction(a)}
                  color={nextAction === a ? "primary" : "default"}
                  variant={nextAction === a ? "filled" : "outlined"}
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
                !(pickedBurden && (pickedBurden !== "__custom__" || customBurden.trim()))
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
                  {p.pickedBurden}
                  {p.nextAction && (
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      → {p.nextAction}
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
