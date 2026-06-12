import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AkibaLens",
  description: "AI figure identification and Japanese marketplace price comparison.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

