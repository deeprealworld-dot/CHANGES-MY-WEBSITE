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
        {/* Marks the page as "loader pending" before first paint so a navy cover hides it until the loader mounts. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var m=location.search.match(/[?&]loader=([1-4])/);if(m&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.setAttribute("data-loader",m[1])}catch(e){}',
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
