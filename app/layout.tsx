import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SkipLink } from "@/components/SkipLink";
import { APP_NAME, TOURNAMENT, VENUE_NAME } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fifa-wc2026-stadium-ai.vercel.app"),
  title: {
    default: `${APP_NAME} — ${TOURNAMENT} Operations & Fan AI`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "A GenAI-powered command center that optimizes stadium operations and enhances the FIFA World Cup 2026 fan experience with real-time, Gemini-powered assistance.",
  applicationName: APP_NAME,
  keywords: [
    "FIFA World Cup 2026",
    "stadium operations",
    "GenAI",
    "Gemini",
    "real-time assistance",
    "crowd management",
    "fan experience",
    "accessibility",
  ],
  authors: [{ name: "Stadium Pulse Team" }],
  category: "technology",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: `${APP_NAME} — ${TOURNAMENT}`,
    description: `Real-time, GenAI-powered operations and fan assistance for ${VENUE_NAME}.`,
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — ${TOURNAMENT}`,
    description:
      "Optimize stadium operations and enhance the fan experience with real-time GenAI assistance.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#05663f" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SkipLink />
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div>
              <p className="text-lg font-bold text-text">{APP_NAME}</p>
              <p className="text-xs text-muted">{TOURNAMENT}</p>
            </div>
            <nav aria-label="Primary">
              <ul className="flex gap-4 text-sm font-medium">
                <li>
                  <a className="text-accent hover:underline" href="#operations">
                    Operations
                  </a>
                </li>
                <li>
                  <a className="text-accent hover:underline" href="#assistant">
                    Fan Assistant
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>

        <footer className="border-t border-border bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-muted">
            {APP_NAME} · A GenAI concept for {TOURNAMENT}. Operational data is
            simulated for demonstration.
          </div>
        </footer>
      </body>
    </html>
  );
}
