import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeepWebStudios | Websites That Win Trust",
  description:
    "Distinctive, fast websites for Mumbai local businesses—designed to build trust and generate real inquiries.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
