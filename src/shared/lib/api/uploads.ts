import { ENDPOINTS } from "@/config/endpoints";
import { api } from "./client";
import { ApiError } from "./errors";

export type UploadPurpose = "product_image" | "category_image" | "avatar" | "message_attachment";

/** Média enregistré par l'API : son `id` est ensuite référencé (`image_ids`, `image_id`…). */
export interface UploadedMedia {
  id: number;
  purpose: UploadPurpose;
  publicId: string;
  url: string;
  format: string;
  bytes: number;
  width: number | null;
  height: number | null;
}

/** Fichier déjà chez Cloudinary, pas encore enregistré par l'API (corps de `POST /uploads/complete/`). */
export interface SentUpload {
  purpose: UploadPurpose;
  publicId: string;
  version: number;
  signature: string;
  format: string;
  bytes: number;
  width: number | null;
  height: number | null;
}

interface UploadSignature {
  uploadUrl: string;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
  transformation: string;
  maxBytes: number;
}

interface CloudinaryResult {
  public_id: string;
  version: number;
  signature: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  error?: { message: string };
}

/** Plus grand côté envoyé : celui que Cloudinary garderait de toute façon (avatar : marge pour le recadrage visage). */
const MAX_SIDE: Record<UploadPurpose, number> = { product_image: 1600, category_image: 1200, avatar: 800, message_attachment: 1600 };
const QUALITY = 0.8;
/** Une signature vaut une heure côté Cloudinary ; on la renouvelle avant. */
const SIGNATURE_TTL_MS = 50 * 60_000;
const PARALLEL = 3;
const BATCH_MAX = 8;

const signatures = new Map<UploadPurpose, { at: number; sig: Promise<UploadSignature> }>();

/** Une signature par usage, réutilisée pour tous les fichiers de l'heure. */
function sign(purpose: UploadPurpose): Promise<UploadSignature> {
  const cached = signatures.get(purpose);
  if (cached && Date.now() - cached.at < SIGNATURE_TTL_MS) return cached.sig;
  const sig = api.post<UploadSignature>(ENDPOINTS.uploads.sign, { purpose });
  signatures.set(purpose, { at: Date.now(), sig });
  sig.catch(() => signatures.delete(purpose));
  return sig;
}

const canvasBlob = (canvas: HTMLCanvasElement, type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));

/**
 * Réduit l'image dans le navigateur (≤ `maxSide` px, WebP ou JPEG qualité 0,8) : une photo de téléphone
 * de 4 à 8 Mo part en ~300 Ko. Renvoie le fichier d'origine s'il est déjà plus léger ou illisible.
 */
export async function shrinkImage(file: File, maxSide: number): Promise<File> {
  if (typeof createImageBitmap !== "function" || !/^image\/(jpe?g|png|webp)$/.test(file.type)) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    // anciens Safari : pas d'encodage WebP (le navigateur renvoie du PNG) → JPEG
    let blob = await canvasBlob(canvas, "image/webp");
    if (blob?.type !== "image/webp") blob = await canvasBlob(canvas, "image/jpeg");
    if (!blob || blob.size >= file.size) return file;
    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "image"}.${ext}`, { type: blob.type });
  } finally {
    bitmap.close();
  }
}

/** Réduit puis envoie le fichier directement à Cloudinary ; l'API ne l'enregistre pas encore. */
export async function sendUpload(original: File, purpose: UploadPurpose): Promise<SentUpload> {
  const [sig, file] = await Promise.all([sign(purpose), shrinkImage(original, MAX_SIDE[purpose])]);
  const format = file.type.split("/")[1]?.toLowerCase() || file.name.split(".").pop()?.toLowerCase() || "";
  if (!sig.allowedFormats.split(",").includes(format)) {
    throw new ApiError(400, `Format non pris en charge (${sig.allowedFormats.replaceAll(",", ", ")}).`);
  }
  if (file.size > sig.maxBytes) throw new ApiError(400, `Fichier trop volumineux (${Math.round(sig.maxBytes / 1048576)} Mo maximum).`);

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  form.append("allowed_formats", sig.allowedFormats);
  form.append("transformation", sig.transformation);

  let res: Response;
  try {
    res = await fetch(sig.uploadUrl, { method: "POST", body: form });
  } catch {
    throw new ApiError(0, "Envoi du fichier impossible.");
  }
  const data = (await res.json().catch(() => ({}))) as CloudinaryResult;
  if (!res.ok) {
    if (res.status === 401) signatures.delete(purpose); // signature expirée : la suivante sera neuve
    throw new ApiError(res.status, data.error?.message ?? "Envoi du fichier refusé.");
  }
  return {
    purpose,
    publicId: data.public_id,
    version: data.version,
    signature: data.signature,
    format: data.format,
    bytes: data.bytes,
    width: data.width ?? null,
    height: data.height ?? null,
  };
}

/** Enregistre des fichiers déjà envoyés, par lots de 8 (`POST /uploads/complete/batch/`) ; même ordre en sortie. */
export async function completeUploads(sent: SentUpload[]): Promise<UploadedMedia[]> {
  const out: UploadedMedia[] = [];
  for (let i = 0; i < sent.length; i += BATCH_MAX) {
    out.push(...(await api.post<UploadedMedia[]>(ENDPOINTS.uploads.completeBatch, { uploads: sent.slice(i, i + BATCH_MAX) })));
  }
  return out;
}

/** Applique `fn` à chaque élément, `limit` à la fois ; résultats dans l'ordre d'entrée. */
async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/** Plusieurs fichiers : une signature, envois à Cloudinary 3 par 3, un seul enregistrement. */
export async function uploadMediaMany(files: File[], purpose: UploadPurpose): Promise<UploadedMedia[]> {
  if (!files.length) return [];
  return completeUploads(await pool(files, PARALLEL, (f) => sendUpload(f, purpose)));
}

/** Un fichier : signature (réutilisée) → Cloudinary → enregistrement. Renvoie le média dont l'`id` se référence. */
export async function uploadMedia(file: File, purpose: UploadPurpose): Promise<UploadedMedia> {
  const sent = await sendUpload(file, purpose);
  return api.post<UploadedMedia>(ENDPOINTS.uploads.complete, sent);
}
