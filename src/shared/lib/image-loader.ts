/**
 * Chargeur `next/image` : les images Cloudinary sont redimensionnées par Cloudinary (format et qualité auto),
 * sans repasser par l'optimiseur de Vercel ; les images locales (légères, mises en cache par le CDN) sont servies telles quelles.
 */
const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/;

export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const match = CLOUDINARY_UPLOAD.exec(src);
  if (match) return `${match[1]}f_auto,q_${quality ?? "auto"},c_limit,w_${width}/${match[2]}`;
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
}
