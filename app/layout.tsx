import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TODO進捗管理アプリ",
  description: "Next.js + Supabaseで構築されたTODO進捗管理アプリ",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
