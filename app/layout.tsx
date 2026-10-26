import type { Metadata } from "next";
import "./globals.css";
import { SiteLoader } from "./site-loader";

export const metadata: Metadata = {
  title: "DeepWebStudios | Websites That Win Trust",
  description:
    "Distinctive, fast websites for ambitious businesses—custom design and thoughtful development, built to earn trust and generate real inquiries.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "512x512" }],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Decides before first paint whether this visit gets the intro: the first visit in this browser
            session, and not for visitors who prefer reduced motion. If sessionStorage is unavailable, the
            intro is skipped. The navy cover this enables releases itself after 5s if the intro never starts. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&!sessionStorage.getItem("dws-intro-seen")){sessionStorage.setItem("dws-intro-seen","1");document.documentElement.setAttribute("data-loader","")}}catch(e){}',
          }}
        />
      </head>
      <body>
        <SiteLoader />
        {children}
      </body>
    </html>
  );
}
