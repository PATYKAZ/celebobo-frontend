import type { NextConfig } from "next";

/**
 * Les images d'API (Django MEDIA_URL) sont servies depuis le backend.
 * Renseigner NEXT_PUBLIC_MEDIA_HOST (ex: "api.celebobo.com") pour next/image.
 */
const mediaHost = process.env.NEXT_PUBLIC_MEDIA_HOST;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Le rond « N » de dev recouvrait les boutons (retour du chat, barre d'onglets) : on le masque. */
  devIndicators: false,
  images: {
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
   * Proxy optionnel vers l'API Django en dev, pour éviter CORS / cookies cross-site :
   * NEXT_PUBLIC_API_URL=/api  +  API_PROXY_TARGET=http://localhost:8000
   */
  async rewrites() {
    const target = process.env.API_PROXY_TARGET;
    if (!target) return [];
    return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
  },
};

export default nextConfig;
