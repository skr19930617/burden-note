"use client";

import { useState } from "react";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Alert from "@mui/material/Alert";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { AiChip } from "./AiBadge";
import { useMe } from "@/lib/store/hooks";
import {
  useGetWeeklyFeedbackQuery,
  useGenerateWeeklyFeedbackMutation,
  useSetFeltAcknowledgedMutation,
} from "@/lib/store";
import {
  feltAcknowledgedSchema,
  type FeltAcknowledged,
} from "@/lib/contracts";

export function WeeklyFeedbackPanel({ weekStart }: { weekStart: string }) {
  const me = useMe();
  const { data, isLoading } = useGetWeeklyFeedbackQuery(weekStart);
  const [generateFeedback, { isLoading: generating }] = useGenerateWeeklyFeedbackMutation();
  const [setFelt] = useSetFeltAcknowledgedMutation();
  const [error, setError] = useState<string | null>(null);
  const [partnerOpen, setPartnerOpen] = useState(false);

  const perUser = data?.perUser ?? [];
  const pick = data?.pick ?? null;

  async function generate() {
    setError(null);
    try {
      await generateFeedback({ weekStart }).unwrap();
    } catch (err) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (() => {
              const d = (err as { data: unknown }).data;
              if (
                d &&
                typeof d === "object" &&
                "error" in d &&
                typeof (d as { error: unknown }).error === "string"
              ) {
                return (d as { error: string }).error;
              }
              return "失敗しました";
            })()
          : err instanceof Error
          ? err.message
          : "失敗しました";
      setError(msg);
    }
  }

  async function setAck(value: FeltAcknowledged | null) {
    if (!me) return;
    await setFelt({
      userId: me.id,
      weekStart,
      feltAcknowledged: value,
    }).unwrap();
  }

  if (isLoading) return null;

  const myFeedback = perUser.find((p) => p.userId === me?.id);
  const partnerFeedback = perUser.find((p) => p.userId !== me?.id);
  const hasAny = perUser.length > 0 || pick?.whatWorked;

  return (
    <Paper variant="outlined" sx={{ p: 3, borderColor: "divider" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h3">第三者からの観察</Typography>
          <AiChip
            label="AI"
            tooltip="今週 shared に出されたカードと、選んだ「減らす負担」をもとに、第三者目線の観察と来週の1手を AI が生成します。private なメモは送られません。"
          />
        </Stack>
        <Button
          size="small"
          variant={hasAny ? "outlined" : "contained"}
          disableElevation
          onClick={generate}
          disabled={generating}
        >
          {generating ? "生成中…" : hasAny ? "もう一度生成" : "今週の観察を出す"}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {!hasAny ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          まだ今週の観察は出ていません。共有されたカードが揃ったら「今週の観察を出す」を押してください。
        </Typography>
      ) : (
        <Stack spacing={2} sx={{ mt: 2 }}>
          {/* 自分宛を最上段に */}
          {myFeedback && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderColor: "rgba(184, 138, 138, 0.6)",
                bgcolor: "rgba(184, 138, 138, 0.08)",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#8b5e5e", mb: 0.75 }}>
                あなたへ
              </Typography>
              {myFeedback.observation && (
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {myFeedback.observation}
                </Typography>
              )}
              {myFeedback.gentleNotice && (
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: "pre-wrap", mt: 1, color: "text.secondary" }}
                >
                  {myFeedback.gentleNotice}
                </Typography>
              )}
            </Paper>
          )}

          {/* 家庭としての観察 */}
          {(pick?.whatWorked || pick?.nextMove) && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderColor: "secondary.main",
                bgcolor: "rgba(138, 160, 145, 0.08)",
              }}
            >
              {pick?.whatWorked && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "secondary.dark", mb: 0.5 }}>
                    今週うまく運んだこと
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {pick.whatWorked}
                  </Typography>
                </Box>
              )}
              {pick?.nextMove && (
                <Box sx={{ mt: pick.whatWorked ? 1.5 : 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "secondary.dark", mb: 0.5 }}>
                    来週の1手
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {pick.nextMove}
                  </Typography>
                </Box>
              )}
            </Paper>
          )}

          {/* 相手宛 (折りたたみ) */}
          {partnerFeedback && (
            <Box>
              <Button
                size="small"
                variant="text"
                onClick={() => setPartnerOpen((v) => !v)}
                sx={{ color: "text.secondary", px: 0 }}
              >
                {partnerOpen
                  ? `▾ ${partnerFeedback.user?.name ?? "相手"} 宛のコメントを隠す`
                  : `▸ ${partnerFeedback.user?.name ?? "相手"} 宛のコメントも見る`}
              </Button>
              <Collapse in={partnerOpen}>
                <Paper variant="outlined" sx={{ p: 2, mt: 1, borderColor: "divider" }}>
                  {partnerFeedback.observation && (
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {partnerFeedback.observation}
                    </Typography>
                  )}
                  {partnerFeedback.gentleNotice && (
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "pre-wrap", mt: 1, color: "text.secondary" }}
                    >
                      {partnerFeedback.gentleNotice}
                    </Typography>
                  )}
                </Paper>
              </Collapse>
            </Box>
          )}

          {/* 自己申告 */}
          {myFeedback && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                今週、相手から労われた感じはあった？
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={myFeedback.feltAcknowledged ?? ""}
                onChange={(_, v: string | null) => {
                  if (v === null) {
                    void setAck(null);
                    return;
                  }
                  const parsed = feltAcknowledgedSchema.safeParse(v);
                  if (parsed.success) void setAck(parsed.data);
                }}
              >
                <ToggleButton value="yes">あった</ToggleButton>
                <ToggleButton value="a_little">少しは</ToggleButton>
                <ToggleButton value="none">あまり</ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                これは集計や比較には使いません。自分の体感メーターです。
              </Typography>
            </Box>
          )}
        </Stack>
      )}
    </Paper>
  );
}
