import { ENDPOINTS } from "@/config/endpoints";
import { ROUTES } from "@/config/routes";
import { api, completeUploads, sendUpload } from "@/shared/lib/api";
import type { AdminBanner, BannerFormValues, BannerImageValue, BannerLinkKind } from "../types";

const { banners } = ENDPOINTS.admin;

/** `/bo/banners/` (après camelCase). */
interface BannerDto {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  linkUrl: string;
  linkLabel: string;
  position: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

const toBanner = (dto: BannerDto): AdminBanner => ({ ...dto });

const PRODUCT_PREFIX = ROUTES.product("");
const CATEGORY_PREFIX = ROUTES.category("");

/** Pages du site proposées comme destination. */
export const BANNER_PAGES = [
  { value: `${ROUTES.products}?onSale=1`, label: "Produits en promotion" },
  { value: ROUTES.products, label: "Tous les produits" },
  { value: ROUTES.guide, label: "Guide d'achat (livraison, paiement)" },
  { value: ROUTES.contact, label: "Contact" },
  { value: ROUTES.becomeReseller, label: "Devenir revendeur" },
];

export function buildLink(kind: BannerLinkKind, target: string): string {
  const t = target.trim();
  if (!t) return "";
  if (kind === "product") return ROUTES.product(t);
  if (kind === "category") return ROUTES.category(t);
  return t;
}

/** Retrouve le type de lien d'une bannière existante à partir de son adresse. */
export function parseLink(url: string): { kind: BannerLinkKind; target: string } {
  if (url.startsWith(PRODUCT_PREFIX) && !url.slice(PRODUCT_PREFIX.length).includes("/")) return { kind: "product", target: url.slice(PRODUCT_PREFIX.length) };
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
  const { kind, target } = parseLink(b.linkUrl);
  return {
    title: b.title,
    subtitle: b.subtitle,
    linkKind: kind,
    linkTarget: target,
    linkProductName: "",
    linkLabel: b.linkLabel,
    isActive: b.isActive,
    startsAt: toLocalInput(b.startsAt),
    endsAt: toLocalInput(b.endsAt),
  };
}

/** L'API attend une URL d'image : le fichier choisi est enregistré, son adresse Cloudinary sert de valeur. */
async function imageUrl(image: BannerImageValue): Promise<string | undefined> {
  if (!image.file) return undefined;
  const send = () => sendUpload(image.file as File, "product_image");
  const sent = await (image.upload ?? send()).catch(send);
  const [media] = await completeUploads([sent]);
  return media.url;
}

function toPayload(v: BannerFormValues) {
  return {
    title: v.title.trim(),
    subtitle: v.subtitle.trim(),
    linkUrl: buildLink(v.linkKind, v.linkTarget),
    linkLabel: v.linkLabel.trim(),
    isActive: v.isActive,
    startsAt: v.startsAt ? new Date(v.startsAt).toISOString() : null,
    endsAt: v.endsAt ? new Date(v.endsAt).toISOString() : null,
  };
}

export const adminBannersService = {
  /** Toutes les bannières (actives, programmées, expirées), dans l'ordre du carrousel. */
  async list(): Promise<AdminBanner[]> {
    return (await api.get<BannerDto[]>(banners.list)).map(toBanner).sort((a, b) => a.position - b.position || a.id - b.id);
  },

  async create(v: BannerFormValues, image: BannerImageValue, position: number): Promise<AdminBanner> {
    const url = await imageUrl(image);
    return toBanner(await api.post<BannerDto>(banners.list, { ...toPayload(v), image: url, position }));
  },

  async update(id: number, v: BannerFormValues, image: BannerImageValue): Promise<AdminBanner> {
    const url = await imageUrl(image);
    return toBanner(await api.patch<BannerDto>(banners.detail(id), { ...toPayload(v), ...(url ? { image: url } : {}) }));
  },

  async patch(id: number, patch: Partial<Pick<AdminBanner, "isActive" | "position">>): Promise<AdminBanner> {
    return toBanner(await api.patch<BannerDto>(banners.detail(id), patch));
  },

  async remove(id: number): Promise<void> {
    await api.delete(banners.detail(id));
  },
};
