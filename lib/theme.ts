"use client";

import { createTheme } from "@mui/material/styles";

// Soft, paper-like palette. The point is to feel like a notebook, not a dashboard.
export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    background: {
      default: "#f8f7f4",
      paper: "#ffffff",
    },
    primary: {
      main: "#403a2d",
      contrastText: "#f8f7f4",
    },
    secondary: {
      main: "#8aa091",
      contrastText: "#1a1812",
    },
    text: {
      primary: "#2b271f",
      secondary: "#6f6753",
    },
    divider: "#dad5c8",
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      "Hiragino Sans",
      "Hiragino Kaku Gothic ProN",
      "Yu Gothic",
      "Meiryo",
      "system-ui",
      "sans-serif",
    ].join(","),
    h1: { fontSize: "1.5rem", fontWeight: 600 },
    h2: { fontSize: "1.125rem", fontWeight: 600 },
    h3: { fontSize: "1rem", fontWeight: 600 },
    body2: { color: "#6f6753" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", borderRadius: 10 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999 },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
  },
});
