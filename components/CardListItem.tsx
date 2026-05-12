"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import {
  CATEGORIES,
  BEARERS,
  WEIGHTS,
  DEPLETED,
  labelOf,
  labelsOf,
} from "@/lib/constants";

export type CardLite = {
  id: string;
  title: string;
  category: string;
  bearer: string;
  weight: string;
  depleted: string[];
  sharing: string;
  occurredAt: string;
  author: { id: string; name: string; color: string | null };
};

export function CardListItem({ card, href }: { card: CardLite; href?: string }) {
  const target = href ?? `/cards/${card.id}`;
  return (
    <Card variant="outlined" sx={{ borderColor: "divider" }}>
      <CardActionArea LinkComponent={Link} href={target}>
        <CardContent>
          <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {card.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {format(new Date(card.occurredAt), "M/d HH:mm", { locale: ja })}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={0.75}
            useFlexGap
            flexWrap="wrap"
            sx={{ mt: 1 }}
          >
            <Chip size="small" label={card.author.name} variant="outlined" />
            <Chip size="small" label={labelOf(CATEGORIES, card.category)} variant="outlined" />
            <Chip size="small" label={labelOf(BEARERS, card.bearer)} variant="outlined" />
            <Chip size="small" label={labelOf(WEIGHTS, card.weight)} variant="outlined" />
            <SharingBadge sharing={card.sharing} />
          </Stack>
          {card.depleted.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              削られた: {labelsOf(DEPLETED, card.depleted).join("・")}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function SharingBadge({ sharing }: { sharing: string }) {
  if (sharing === "shared") {
    return <Chip size="small" label="共有済み" color="secondary" />;
  }
  if (sharing === "candidate") {
    return <Chip size="small" label="共有候補" color="warning" />;
  }
  return <Chip size="small" label="自分だけ" variant="outlined" />;
}
