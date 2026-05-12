"use client";

import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

type Option = { value: string; label: string };

export function ChipGroup({
  options,
  value,
  onChange,
  multi = false,
  help,
}: {
  options: readonly Option[];
  value: string | string[];
  onChange: (next: string | string[]) => void;
  multi?: boolean;
  help?: string;
}) {
  const selected = Array.isArray(value) ? value : [value];

  function toggle(v: string) {
    if (multi) {
      const set = new Set(selected);
      if (set.has(v)) set.delete(v);
      else set.add(v);
      onChange(Array.from(set));
    } else {
      onChange(v);
    }
  }

  return (
    <Box>
      <Stack direction="row" useFlexGap flexWrap="wrap" spacing={0.75}>
        {options.map((opt) => {
          const on = selected.includes(opt.value);
          return (
            <Chip
              key={opt.value}
              label={opt.label}
              onClick={() => toggle(opt.value)}
              color={on ? "primary" : "default"}
              variant={on ? "filled" : "outlined"}
              sx={{ height: 32 }}
            />
          );
        })}
      </Stack>
      {help && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
          {help}
        </Typography>
      )}
    </Box>
  );
}
