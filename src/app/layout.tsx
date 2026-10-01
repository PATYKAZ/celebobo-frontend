import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { SITE } from "@/config/site";
import { Providers } from "@/shared/providers/Providers";
import "./globals.css";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
};

export const viewport: Viewport = {
  themeColor: "#1ABA1A",
  width: "device-width",
  initialScale: 1,
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
