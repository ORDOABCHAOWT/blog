import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono, Noto_Sans_SC } from "next/font/google";
import PageTransition from "@/components/PageTransition";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ibm-plex",
});

const notoSansSc = Noto_Sans_SC({
  weight: "variable",
  display: "swap",
  variable: "--font-noto-sans-sc",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

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
    <html
      lang="zh-CN"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${ibmPlexSans.variable} ${notoSansSc.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <PageTransition />
        {children}
      </body>
    </html>
  );
}
