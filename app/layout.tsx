import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TODO進捗管理アプリ",
  description: "Next.js + Supabaseで構築されたTODO進捗管理アプリ",
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
