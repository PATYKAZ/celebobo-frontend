import { ENDPOINTS } from "@/config/endpoints";
import { api } from "./client";
import { ApiError } from "./errors";

export type JobStatus = "pending" | "running" | "done" | "failed";
export type JobKind = "sales_export" | "products_export" | "products_import" | "analytics_report";
export type JobFormat = "csv" | "xlsx" | "pdf";

/** Tâche asynchrone de l'API (exports, imports, rapports PDF) — renvoyée en 202 puis suivie via `GET /jobs/{id}/`. */
export interface Job<S = Record<string, unknown>> {
  id: string;
  kind: JobKind;
  format: JobFormat;
  status: JobStatus;
  filename: string;
  size: number;
  /** Résultat métier (import : compteurs et erreurs par ligne). */
  summary: S;
  error: string;
  downloadable: boolean;
  createdAt: string;
  finishedAt: string | null;
}

export interface WaitForJobOptions {
  /** Délai entre deux interrogations (ms). */
  interval?: number;
  /** Abandon au-delà de ce délai (ms). */
  timeout?: number;
  signal?: AbortSignal;
  onProgress?: (job: Job) => void;
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Annulé", "AbortError"));
    });
  });

/**
 * Attend la fin d'une tâche : interroge `GET /jobs/{id}/` jusqu'à `done` (renvoyée) ou `failed` (ApiError).
 * Accepte la tâche renvoyée par le POST de lancement ou son id.
 */
export async function waitForJob<S = Record<string, unknown>>(job: Job<S> | string, opts: WaitForJobOptions = {}): Promise<Job<S>> {
  const { interval = 1000, timeout = 120_000, signal, onProgress } = opts;
  let current = typeof job === "string" ? await api.get<Job<S>>(ENDPOINTS.jobs.detail(job)) : job;
  const deadline = Date.now() + timeout;
  while (current.status === "pending" || current.status === "running") {
    if (Date.now() > deadline) throw new ApiError(408, "La tâche prend plus de temps que prévu. Réessayez dans un instant.");
    await sleep(interval, signal);
    current = await api.get<Job<S>>(ENDPOINTS.jobs.detail(current.id), { signal });
    onProgress?.(current as Job);
  }
  if (current.status === "failed") throw new ApiError(422, current.error || "La tâche a échoué.", current);
  return current;
}

/** Lance une tâche (POST qui renvoie 202 + Job) et attend son résultat. */
export async function runJob<S = Record<string, unknown>>(start: Promise<Job<S>>, opts?: WaitForJobOptions): Promise<Job<S>> {
  return waitForJob(await start, opts);
}

/** URL du fichier produit par une tâche terminée (cookies de session : même origine via le proxy). */
export const jobDownloadUrl = (job: Pick<Job, "id">) => api.url(ENDPOINTS.jobs.download(job.id));

/** Déclenche le téléchargement du fichier d'une tâche terminée. */
export function downloadJob(job: Pick<Job, "id" | "filename">) {
  const a = document.createElement("a");
  a.href = jobDownloadUrl(job);
  a.download = job.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
