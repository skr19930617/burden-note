"use client";

import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

// One reusable affordance so every "AI runs here / output is from AI" spot looks the same.
// Two surfaces:
//   <AiChip />     — a small chip you can place inside or next to a label
//   <AiTooltip>    — wraps any element and explains what AI will/did do here

const DEFAULT_TIP =
  "ここで AI が動きます。あなたの生の入力を、相手に見せても責められた印象になりにくい表現へ整えます。";

export function AiChip({
  label = "AI",
  tooltip = DEFAULT_TIP,
  size = "small",
}: {
  label?: string;
  tooltip?: string;
  size?: "small" | "medium";
}) {
  return (
    <Tooltip title={tooltip} placement="top" arrow enterTouchDelay={0} leaveTouchDelay={4000}>
      <Chip
        size={size}
        icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
        label={label}
        sx={{
          color: "secondary.main",
          borderColor: "secondary.main",
          bgcolor: "transparent",
          "& .MuiChip-icon": { color: "secondary.main" },
        }}
        variant="outlined"
      />
    </Tooltip>
  );
}

// Wrap any button / textarea to attach the AI tooltip without restyling it.
export function AiTooltip({
  children,
  title = DEFAULT_TIP,
  fullWidth = false,
}: {
  children: React.ReactElement;
  title?: string;
  fullWidth?: boolean;
}) {
  return (
    <Tooltip title={title} placement="top" arrow enterTouchDelay={0} leaveTouchDelay={4000}>
      <Box
        component="span"
        sx={{
          display: fullWidth ? "flex" : "inline-flex",
          flex: fullWidth ? 1 : undefined,
          width: fullWidth ? "100%" : undefined,
        }}
      >
        {children}
      </Box>
    </Tooltip>
  );
}
