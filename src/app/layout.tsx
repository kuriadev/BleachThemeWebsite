import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Serif_JP } from "next/font/google";
import { prefsInitScript } from "@/lib/prefs";
import { ExperienceProvider } from "@/providers/ExperienceProvider";
import { TopBar } from "@/components/layout/TopBar";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Kanji watermarks: heavy serif, not preloaded (decorative, large file).
const kanji = Noto_Serif_JP({
  variable: "--font-kanji",
  weight: ["400", "900"],
  subsets: ["latin"],
  preload: false,
  display: "swap",
});

export const metadata: Metadata = {
  title: "BLEACH — Kyōka Suigetsu",
  description:
    "An immersive, unofficial Bleach fan experience: shatter the illusion, then walk the Zanpakutō Codex.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "BLEACH — Kyōka Suigetsu",
    description: "An immersive, unofficial Bleach fan experience.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${kanji.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: prefsInitScript }} />
      </head>
      <body>
        <ExperienceProvider>
          <TopBar />
          {children}
        </ExperienceProvider>
      </body>
    </html>
  );
}
