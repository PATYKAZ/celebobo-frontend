import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

/**
 * POST /revalidate — appelé par Django après une modification du catalogue (BACKEND_CHANGES P1-3).
 * En-tête `X-Revalidate-Secret` ; corps `{ "tags": ["product:<slug>", "category:<slug>", "home", "sitemap"] }`.
 * Hors /api/ : nginx envoie /api vers Django, le reste vers Next.
 */
const SECRET = process.env.REVALIDATE_SECRET ?? "";
const TAG = /^[a-z0-9][a-z0-9:_-]{0,119}$/;
const MAX_TAGS = 200;

const sameSecret = (given: string) => {
  const a = Buffer.from(given);
  const b = Buffer.from(SECRET);
  return a.length === b.length && timingSafeEqual(a, b);
};

export async function POST(request: Request) {
  if (!SECRET) return Response.json({ detail: "Revalidation désactivée (REVALIDATE_SECRET absent)." }, { status: 503 });
  if (!sameSecret(request.headers.get("x-revalidate-secret") ?? "")) return Response.json({ detail: "Non autorisé." }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const tags = (body as { tags?: unknown } | null)?.tags;
  if (!Array.isArray(tags) || tags.length === 0 || tags.length > MAX_TAGS || !tags.every((t) => typeof t === "string" && TAG.test(t))) {
    return Response.json({ detail: "Corps attendu : { tags: string[] } (1 à 200 étiquettes, [a-z0-9:_-])." }, { status: 400 });
  }
  // expire 0 : la requête suivante attend les données fraîches (prix, stock) au lieu de servir l'ancienne version
  for (const tag of new Set(tags)) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: [...new Set(tags)] });
}
