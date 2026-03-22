import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taffy's Blog",
  description: "Essays, project notes, and field observations by Taffy Wang.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
