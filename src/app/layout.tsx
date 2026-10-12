import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SITE } from "@/config/site";
import { siteUrl } from "@/config/site-url";
import { Providers } from "@/shared/providers/Providers";
import { THEME_SCRIPT } from "@/shared/theme/theme";
import "./globals.css";

/**
 * Alibaba Sans (Latin W1G) — gratuite y compris en usage commercial (fonts.alibabagroup.com), auto-hébergée.
 * Pas de SemiBold dans la famille : la Medium couvre 500–600 pour que `font-semibold` reste distinct de `font-bold`.
 * 4 fichiers réduits au latin (français, Latin étendu A) : ~83 Ko au lieu de 277 Ko pour 6 graisses complètes.
 */
const alibabaSans = localFont({
  src: [
    { path: "./fonts/alibaba-sans/AlibabaSans-Regular.woff2", weight: "300 400", style: "normal" },
    { path: "./fonts/alibaba-sans/AlibabaSans-Medium.woff2", weight: "500 600", style: "normal" },
    { path: "./fonts/alibaba-sans/AlibabaSans-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/alibaba-sans/AlibabaSans-Heavy.woff2", weight: "800 900", style: "normal" },
  ],
  variable: "--font-alibaba",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  openGraph: { siteName: SITE.name, locale: "fr_CD", type: "website" },
};

export const viewport: Viewport = {
  // ajustée au thème choisi par useTheme
  themeColor: "#226D68",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // le script de thème pose la classe `dark` avant l'hydratation
    <html lang="fr" className={alibabaSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
