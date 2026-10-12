import { ENDPOINTS } from "@/config/endpoints";
import { ROUTES } from "@/config/routes";
import { api, completeUploads, sendUpload } from "@/shared/lib/api";
import type { AdminBanner, BannerFormValues, BannerImageValue, BannerLinkKind } from "../types";

const { banners } = ENDPOINTS.admin;

/** `/bo/banners/` (après camelCase) ; `product` est la carte produit complète. */
interface BannerDto extends Omit<AdminBanner, "product"> {
  product: { id: number; slug: string; name: string; image: string } | null;
}

const toBanner = ({ product, ...dto }: BannerDto): AdminBanner => ({
  ...dto,
  product: product && { id: product.id, slug: product.slug, name: product.name, image: product.image },
});

const CATEGORY_PREFIX = ROUTES.category("");

/** Pages du site proposées comme destination. */
export const BANNER_PAGES = [
  { value: `${ROUTES.products}?onSale=1`, label: "Produits en promotion" },
  { value: ROUTES.products, label: "Tous les produits" },
  { value: ROUTES.guide, label: "Guide d'achat (livraison, paiement)" },
  { value: ROUTES.contact, label: "Contact" },
  { value: ROUTES.becomeReseller, label: "Devenir revendeur" },
];

/** Adresse du bouton ; une bannière produit n'en a pas (l'API mène à la fiche du produit). */
export function buildLink(kind: BannerLinkKind, target: string): string {
  const t = target.trim();
  if (!t || kind === "product") return "";
  if (kind === "category") return ROUTES.category(t);
  return t;
}

/** Retrouve le type de lien d'une bannière sans produit à partir de son adresse. */
export function parseLink(url: string): { kind: BannerLinkKind; target: string } {
  if (url.startsWith(CATEGORY_PREFIX)) return { kind: "category", target: url.slice(CATEGORY_PREFIX.length) };
  if (BANNER_PAGES.some((p) => p.value === url)) return { kind: "page", target: url };
  return { kind: "url", target: url };
}

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export function bannerToForm(b: AdminBanner): BannerFormValues {
  const { kind, target } = b.productId ? { kind: "product" as const, target: "" } : parseLink(b.linkUrl);
  return {
    placement: b.placement,
    title: b.title,
    subtitle: b.subtitle,
    eyebrow: b.eyebrow,
    tone: b.tone,
    linkKind: kind,
    linkTarget: target,
    productId: b.productId,
    productName: b.product?.name ?? "",
    linkLabel: b.linkLabel,
    isActive: b.isActive,
    startsAt: toLocalInput(b.startsAt),
    endsAt: toLocalInput(b.endsAt),
  };
}

/** L'API attend une URL d'image : le fichier choisi est enregistré, son adresse Cloudinary sert de valeur. */
async function imageUrl(image: BannerImageValue): Promise<string | undefined> {
  if (!image.file) return undefined;
  const send = () => sendUpload(image.file as File, "banner");
  const sent = await (image.upload ?? send()).catch(send);
  const [media] = await completeUploads([sent]);
  return media.url;
}

function toPayload(v: BannerFormValues) {
  return {
    placement: v.placement,
    title: v.title.trim(),
    subtitle: v.subtitle.trim(),
    eyebrow: v.eyebrow.trim(),
    tone: v.tone,
    productId: v.linkKind === "product" ? v.productId : null,
    linkUrl: buildLink(v.linkKind, v.linkTarget),
    linkLabel: v.linkLabel.trim(),
    isActive: v.isActive,
    startsAt: v.startsAt ? new Date(v.startsAt).toISOString() : null,
    endsAt: v.endsAt ? new Date(v.endsAt).toISOString() : null,
  };
}

export const adminBannersService = {
  /** Toutes les bannières (actives, programmées, expirées) de tous les emplacements, dans l'ordre d'affichage. */
  async list(): Promise<AdminBanner[]> {
    return (await api.get<BannerDto[]>(banners.list)).map(toBanner).sort((a, b) => a.position - b.position || a.id - b.id);
  },

  async create(v: BannerFormValues, image: BannerImageValue, position: number): Promise<AdminBanner> {
    const url = await imageUrl(image);
    return toBanner(await api.post<BannerDto>(banners.list, { ...toPayload(v), image: url, position }));
  },

  async update(id: number, v: BannerFormValues, image: BannerImageValue, position?: number): Promise<AdminBanner> {
    const url = await imageUrl(image);
    return toBanner(await api.patch<BannerDto>(banners.detail(id), { ...toPayload(v), ...(url ? { image: url } : {}), ...(position != null ? { position } : {}) }));
  },

  async patch(id: number, patch: Partial<Pick<AdminBanner, "isActive" | "position">>): Promise<AdminBanner> {
    return toBanner(await api.patch<BannerDto>(banners.detail(id), patch));
  },

  /** Nouvel ordre d'un emplacement, en un appel. */
  async reorder(placement: string, ids: number[]): Promise<void> {
    await api.post(banners.reorder, { placement, ids });
  },

  async remove(id: number): Promise<void> {
    await api.delete(banners.detail(id));
  },
};
