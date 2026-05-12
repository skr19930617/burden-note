"use client";

import { useRouter, usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { UserSwitcher } from "./UserSwitcher";

const NAV = [
  { href: "/", label: "書く" },
  { href: "/cards", label: "自分のメモ" },
  { href: "/shared", label: "2人で見る" },
  { href: "/review", label: "ふりかえり" },
];

function matchValue(pathname: string): string {
  // Pick the longest prefix match.
  let value = "/";
  for (const item of NAV) {
    if (item.href === "/") continue;
    if (pathname.startsWith(item.href) && item.href.length > value.length) {
      value = item.href;
    }
  }
  if (value === "/" && pathname !== "/") return "/";
  return value;
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const value = matchValue(pathname);

  return (
    <AppBar
      position="sticky"
      color="transparent"
      sx={{
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(248, 247, 244, 0.85)",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          minHeight: { xs: 56, sm: 56 },
          flexWrap: "wrap",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          負担の見える化ノート
        </Typography>
        <UserSwitcher />
      </Toolbar>
      <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
        <Tabs
          value={value}
          onChange={(_, v) => router.push(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40, py: 0.5 } }}
        >
          {NAV.map((item) => (
            <Tab key={item.href} value={item.href} label={item.label} />
          ))}
        </Tabs>
      </Box>
    </AppBar>
  );
}
