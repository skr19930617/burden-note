"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { CardForm } from "@/components/CardForm";
import { useMe } from "@/lib/store/hooks";

export default function HomePage() {
  const me = useMe();
  const router = useRouter();
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  if (!me) {
    return (
      <Paper variant="outlined" sx={{ p: 3, borderColor: "divider" }}>
        <Typography variant="body2">ユーザーを準備中です。</Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={2.5}>
      <IntentBanner />

      <CardForm
        authorId={me.id}
        onSaved={(id, sharing) => {
          if (sharing === "candidate") {
            router.push(`/cards/${id}`);
          } else {
            setSavedNotice("自分のメモとして保存しました。共有はあとから選べます。");
            setTimeout(() => setSavedNotice(null), 4000);
          }
        }}
      />

      {savedNotice && <Alert severity="success">{savedNotice}</Alert>}
    </Stack>
  );
}

function IntentBanner() {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2.5, borderColor: "divider", borderRadius: 3 }}
    >
      <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.7 }}>
        これは、どちらが多くやっているかを決めるものではありません。
        <br />
        お互いに見えていない負担を見つけて、
        <Typography component="span" variant="body2" sx={{ fontWeight: 700 }}>
          次に減らす負担を1つ選ぶため
        </Typography>
        のノートです。
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
        作業量ではなく「何が削られたか」を中心に置いています。
        入力したものはまず自分用メモになり、共有は別の画面で選びます。
      </Typography>
    </Paper>
  );
}
