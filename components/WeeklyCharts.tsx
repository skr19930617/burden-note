"use client";

import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useGetInsightsQuery } from "@/lib/store";
import type {
  ReducePoint,
  VisibilityPoint,
  GratitudePoint,
} from "@/lib/contracts";

// Soft palette to keep charts feeling like a notebook, not a dashboard.
const COLORS = {
  reduce: "#564f3f",
  visibility: "#b88a8a",
  gratitude: ["#8aa091", "#c9a36f", "#5b7a9a", "#b88a8a"],
};

export function WeeklyCharts({ weeks = 8 }: { weeks?: number }) {
  const { data, isLoading } = useGetInsightsQuery({ weeks });

  if (isLoading) {
    return (
      <Typography variant="body2" color="text.secondary">
        グラフを読み込み中…
      </Typography>
    );
  }
  if (!data) return null;

  return (
    <Stack spacing={2}>
      <ReduceChart series={data.reduceSeries} />
      <VisibilityCard series={data.visibilitySeries} />
      <GratitudeChart series={data.gratitudeSeries} users={data.users} />
    </Stack>
  );
}

function ReduceChart({ series }: { series: ReducePoint[] }) {
  const rows = series.map((s) => ({
    week: format(parseISO(s.weekStart), "M/d", { locale: ja }),
    intensity: s.intensity,
    label: s.pickedBurdenLabel ?? "—",
  }));
  const hasAny = rows.some((r) => r.intensity > 0);
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderColor: "divider" }}>
      <Typography variant="h3">減らす負担トラッカー</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
        「来週減らす」と選んだ負担タイプが、その後の週でどう推移したか。線が下がっていれば実際に減ったということ。
      </Typography>
      {!hasAny ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          まだ追跡可能なデータがありません。ふりかえりで負担を1つ選ぶと、ここに線が出始めます。
        </Typography>
      ) : (
        <Box sx={{ height: 180, mt: 1.5 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#e6e2d6" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6f6753" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6f6753" }} width={28} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#dad5c8" }}
                formatter={(value) => [`${value}`, "重さ"]}
                labelFormatter={(label) => `${String(label ?? "")} の週`}
              />
              <Line
                type="monotone"
                dataKey="intensity"
                stroke={COLORS.reduce}
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS.reduce }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
}

function VisibilityCard({ series }: { series: VisibilityPoint[] }) {
  // Compute latest and previous non-empty point.
  const filled = series.filter((s) => s.ratio !== null);
  const latest = filled[filled.length - 1];
  const prev = filled[filled.length - 2];

  const latestPct = latest ? Math.round((latest.ratio ?? 0) * 100) : null;
  const prevPct = prev ? Math.round((prev.ratio ?? 0) * 100) : null;
  const delta = latestPct !== null && prevPct !== null ? latestPct - prevPct : null;

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderColor: "divider" }}>
      <Typography variant="h3">見えていなかった負担の割合</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
        共有されたカードのうち「相手に見えていなかった / 見えてほしかった」の割合。下がる = 相互に見えるようになっている。
      </Typography>
      {latestPct === null ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          まだ共有されたカードがありません。
        </Typography>
      ) : (
        <Stack direction="row" alignItems="baseline" spacing={2} sx={{ mt: 2 }}>
          <Typography variant="h2" sx={{ color: COLORS.visibility, fontSize: 36 }}>
            {latestPct}%
          </Typography>
          {delta !== null && (
            <Typography variant="caption" color="text.secondary">
              先週 {prevPct}% → {delta === 0 ? "横ばい" : delta < 0 ? `↓ ${Math.abs(delta)}pt` : `↑ ${delta}pt`}
            </Typography>
          )}
        </Stack>
      )}
    </Paper>
  );
}

function GratitudeChart({
  series,
  users,
}: {
  series: GratitudePoint[];
  users: { id: string; name: string }[];
}) {
  if (users.length === 0) return null;
  const rows = series.map((s) => {
    const row: Record<string, number | string> = {
      week: format(parseISO(s.weekStart), "M/d", { locale: ja }),
    };
    for (const u of users) {
      row[u.id] = s.perUser[u.id]?.ackReceived ?? 0;
    }
    return row;
  });

  const hasAny = series.some((s) =>
    users.some((u) => (s.perUser[u.id]?.ackReceived ?? 0) > 0),
  );

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderColor: "divider" }}>
      <Typography variant="h3">ありがとうの交換</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
        「受け取った」と相手が確認したものだけをカウントしています。合算はしません — 一方通行を見えなくしないように。
      </Typography>
      {!hasAny ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          まだ受け取り確認のついたありがとうがありません。
        </Typography>
      ) : (
        <Box sx={{ height: 180, mt: 1.5 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#e6e2d6" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6f6753" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6f6753" }} width={28} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#dad5c8" }}
                labelFormatter={(label) => `${String(label ?? "")} の週`}
                formatter={(value, name) => {
                  const u = users.find((x) => x.id === String(name));
                  return [`${value ?? 0}`, u ? `${u.name} が受け取った` : String(name ?? "")];
                }}
              />
              {users.map((u, i) => (
                <Line
                  key={u.id}
                  type="monotone"
                  dataKey={u.id}
                  name={u.id}
                  stroke={COLORS.gratitude[i % COLORS.gratitude.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
      <Stack direction="row" spacing={1.5} sx={{ mt: 1, flexWrap: "wrap" }}>
        {users.map((u, i) => (
          <Stack key={u.id} direction="row" alignItems="center" spacing={0.5}>
            <Box
              sx={{
                width: 10,
                height: 2,
                bgcolor: COLORS.gratitude[i % COLORS.gratitude.length],
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {u.name} が受け取った
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
