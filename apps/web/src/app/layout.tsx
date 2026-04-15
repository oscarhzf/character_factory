import type { Metadata } from "next";
import { readServerEnv } from "@character-factory/core";

import "./globals.css";

const env = readServerEnv();

export const metadata: Metadata = {
  title: env.NEXT_PUBLIC_APP_NAME,
  description: "Character Factory MVP workspace"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

