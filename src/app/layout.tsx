import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SITE } from "@/config/site";
import { siteUrl } from "@/config/site-url";
import { Providers } from "@/shared/providers/Providers";
import "./globals.css";

/**
 * Alibaba Sans (Latin W1G) — gratuite y compris en usage commercial (fonts.alibabagroup.com), auto-hébergée.
 * Pas de SemiBold dans la famille : la Medium couvre 500–600 pour que `font-semibold` reste distinct de `font-bold`.
 */
const alibabaSans = localFont({
  src: [
    { path: "./fonts/alibaba-sans/AlibabaSans-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/alibaba-sans/AlibabaSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/alibaba-sans/AlibabaSans-Medium.woff2", weight: "500 600", style: "normal" },
    { path: "./fonts/alibaba-sans/AlibabaSans-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/alibaba-sans/AlibabaSans-Heavy.woff2", weight: "800", style: "normal" },
    { path: "./fonts/alibaba-sans/AlibabaSans-Black.woff2", weight: "900", style: "normal" },
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
  themeColor: "#226D68",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={alibabaSans.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
