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

/**
 * Envoie un fichier : signature (`POST /uploads/sign/`) → envoi direct à Cloudinary → enregistrement
 * (`POST /uploads/complete/`). Renvoie le média dont l'`id` se référence dans les formulaires.
 */
export async function uploadMedia(file: File, purpose: UploadPurpose): Promise<UploadedMedia> {
  const sig = await api.post<UploadSignature>(ENDPOINTS.uploads.sign, { purpose });
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
  if (!res.ok) throw new ApiError(res.status, data.error?.message ?? "Envoi du fichier refusé.");

  return api.post<UploadedMedia>(ENDPOINTS.uploads.complete, {
    purpose,
    publicId: data.public_id,
    version: data.version,
    signature: data.signature,
    format: data.format,
    bytes: data.bytes,
    width: data.width ?? null,
    height: data.height ?? null,
  });
}
