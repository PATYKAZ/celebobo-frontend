import type { NextConfig } from "next";

/**
 * Les images d'API (Django MEDIA_URL) sont servies depuis le backend.
 * Renseigner NEXT_PUBLIC_MEDIA_HOST (ex: "api.celebobo.com") pour next/image.
 */
const mediaHost = process.env.NEXT_PUBLIC_MEDIA_HOST;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Image Docker autonome (deploy/compose du backend) : `node server.js`, sans node_modules complet. */
  output: "standalone",
  /** Le rond « N » de dev recouvrait les boutons (retour du chat, barre d'onglets) : on le masque. */
  devIndicators: false,
  /** Django attend la barre oblique finale : Next ne doit pas la retirer avant le proxy /api. */
  skipTrailingSlashRedirect: true,
  images: {
    loader: "custom",
    loaderFile: "./src/shared/lib/image-loader.ts",
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      ...(mediaHost
        ? [
            { protocol: "https" as const, hostname: mediaHost },
            { protocol: "http" as const, hostname: mediaHost },
          ]
        : []),
      { protocol: "http", hostname: "localhost", port: "8000" },
    ],
  },
  /**
   * Proxy optionnel vers l'API Django, quand le front n'est pas servi derrière le nginx du backend
   * (ex. hébergé sur Vercel) : NEXT_PUBLIC_API_URL=/api/v1 + API_PROXY_TARGET=https://<api>.
   * Derrière nginx (local et production auto-hébergée), nginx route déjà /api et /ws : laisser vide.
   */
  async rewrites() {
    const target = process.env.API_PROXY_TARGET;
    if (!target) return [];
    return [
      { source: "/api/:path*/", destination: `${target}/api/:path*/` },
      { source: "/api/:path*", destination: `${target}/api/:path*` },
    ];
  },
};

export default nextConfig;
