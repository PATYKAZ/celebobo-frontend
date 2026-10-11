import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { SITE } from "@/config/site";
import { siteUrl } from "@/config/site-url";
import { Providers } from "@/shared/providers/Providers";
import "./globals.css";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
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
    <html lang="fr" className={hanken.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
