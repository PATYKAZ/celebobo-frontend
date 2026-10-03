import { ENDPOINTS } from "@/config/endpoints";
import { api, ApiError } from "@/shared/lib/api";

export type UploadPurpose = "avatar" | "product_image" | "category_image" | "message_attachment";

/** `POST /uploads/sign/` (après camelCase). */
interface SignatureDto {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
  transformation: string;
  maxBytes: number;
}

/** Réponse brute de Cloudinary (snake_case). */
interface CloudinaryUpload {
  public_id: string;
  version: number;
  signature: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

/** `POST /uploads/complete/` (après camelCase). */
export interface UploadedMedia {
  id: number;
  purpose: string;
  publicId: string;
  url: string;
  format: string;
  bytes: number;
  width: number | null;
  height: number | null;
}

/**
 * Envoi d'image en 3 temps : signature par l'API → envoi direct à Cloudinary → enregistrement côté API.
 * Le `id` renvoyé se passe ensuite à l'API (ex. `avatar_upload_id`).
 */
export async function uploadImage(purpose: UploadPurpose, file: File): Promise<UploadedMedia> {
  const sig = await api.post<SignatureDto>(ENDPOINTS.uploads.sign, { purpose });
  const format = file.type.split("/")[1]?.toLowerCase() || file.name.split(".").pop()?.toLowerCase() || "";
  if (!sig.allowedFormats.split(",").includes(format)) {
    throw new ApiError(400, `Format non pris en charge (${sig.allowedFormats.replaceAll(",", ", ")}).`);
  }
  if (file.size > sig.maxBytes) throw new ApiError(400, `Image trop lourde (${Math.round(sig.maxBytes / 1024 / 1024)} Mo maximum).`);

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
    throw new ApiError(0, "Envoi de l'image impossible.");
  }
  if (!res.ok) throw new ApiError(res.status, "Envoi de l'image refusé par le serveur de médias.");
  const up = (await res.json()) as CloudinaryUpload;

  return api.post<UploadedMedia>(ENDPOINTS.uploads.complete, {
    purpose,
    publicId: up.public_id,
    version: up.version,
    signature: up.signature,
    format: up.format,
    bytes: up.bytes,
    width: up.width ?? null,
    height: up.height ?? null,
  });
}
