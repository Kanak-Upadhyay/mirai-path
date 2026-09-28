import type { Metadata } from "next";

import { ThemeProvider } from "@/components/ThemeProvider";

import "./globals.css";

const themeScript = `(function(){try{if(localStorage.getItem("mirai-theme")==="dark"){document.documentElement.classList.add("dark");}}catch(e){}})();`;

export const metadata: Metadata = {
  title: {
    default: "MIRAI PATH",
    template: "%s · MIRAI PATH",
  },
  description:
    "MIRAI PATH = FUTURE + PATH. An AI-powered career companion. Mirai (未来) means Future.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-[var(--mp-surface)] focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
