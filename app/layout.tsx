import type { Metadata, Viewport } from "next";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { ThemeRegistry } from "@/components/ThemeRegistry";
import { UserContextProvider } from "@/components/UserContext";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "負担の見える化ノート",
  description:
    "どちらが多くやっているかを決めるためではなく、見えていない負担を見つけ、次に減らす負担を1つ選ぶためのノート。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <ThemeRegistry>
          <UserContextProvider>
            <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
              <Header />
              <Container maxWidth="sm" sx={{ pb: 10, pt: { xs: 2, sm: 3 } }}>
                {children}
              </Container>
            </Box>
          </UserContextProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
