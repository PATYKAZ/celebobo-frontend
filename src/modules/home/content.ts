import { ROUTES } from "@/config/routes";
import type { Brand, CategoryColumn, HomeBlock, HomeContent, ShowcaseConfig } from "./types";

/** Photo Pexels (domaine autorisé dans next.config) pour le contenu de secours. */
const px = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;

/** Marques connues : seules celles présentes dans le catalogue s'affichent (cf. home.mapper). */
export const BRANDS: Brand[] = [
  { name: "Apple", aliases: ["iPhone", "iPad", "MacBook", "AirPods"], className: "text-xl font-semibold tracking-tight", color: "#111" },
  { name: "SONY", className: "text-xl font-bold", color: "#111" },
  { name: "JBL", className: "text-2xl font-bold italic", color: "#FF3300" },
  { name: "logitech", className: "text-xl font-bold lowercase tracking-tight", color: "#00B8FC" },
  { name: "hp", className: "text-2xl font-bold lowercase", color: "#0096D6" },
  { name: "DELL", className: "text-xl font-bold", color: "#007DB8" },
  { name: "Xiaomi", aliases: ["Redmi", "Poco"], className: "text-xl font-bold tracking-tight", color: "#FF6900" },
  { name: "SAMSUNG", className: "text-lg font-bold", color: "#1428A0" },
  { name: "Canon", className: "text-xl font-bold italic", color: "#CC0000" },
  { name: "HUAWEI", className: "text-lg font-bold", color: "#CF0A2C" },
  { name: "TECNO", className: "text-xl font-bold", color: "#0072CE" },
  { name: "Infinix", className: "text-xl font-bold tracking-tight", color: "#2DB24A" },
  { name: "Lenovo", className: "text-xl font-bold tracking-tight", color: "#E2231A" },
  { name: "ANKER", className: "text-xl font-bold", color: "#00A7E1" },
  { name: "LG", className: "text-2xl font-bold", color: "#A50034" },
  { name: "PHILIPS", className: "text-lg font-bold tracking-wide", color: "#0B5ED7" },
  { name: "Moulinex", className: "text-xl font-bold italic", color: "#E2001A" },
  { name: "MICHELIN", className: "text-lg font-bold", color: "#27509B" },
];

/**
 * Contenu éditorial de l'accueil (textes et visuels du design), propre au front.
 * Les liens pointent vers des catégories (slugs) ou des recherches, jamais vers des ids figés.
 * Les bannières gérées dans le back-office remplacent les slides (cf. home.service). Aucun prix ni produit
 * n'est écrit ici : ils viennent tous de l'API (cf. home.mapper → picks, brands).
 */
export function buildHomeContent(): HomeContent {
  const content: Omit<HomeContent, "blocks"> = {
    catalog: null,
    picks: null,
    placements: null,
    slides: [
      {
        id: 1,
        image: px(35714343),
        tone: "dark",
        eyebrow: "",
        titleLines: [
          { text: "Nouvelle collection", className: "text-white" },
          { text: "wax", className: "text-primary-light" },
        ],
        text: "Robes, pagnes et sacs, livrés à Bukavu, à Goma et dans tout le pays.",
        cta: { label: "Découvrir", href: ROUTES.category("mode-femme-homme"), variant: "primary" },
        overlay: "from-black/80 via-black/45 to-transparent",
      },
      {
        id: 2,
        image: px(28726706),
        tone: "dark",
        eyebrow: "",
        titleLines: [
          { text: "Équipez", className: "text-white font-normal" },
          { text: "votre cuisine", className: "text-primary-light font-bold" },
        ],
        text: "Casseroles, vaisselle et linge de maison.",
        cta: { label: "Acheter", href: ROUTES.category("maison-cuisine"), variant: "white" },
        overlay: "from-black/85 via-black/50 to-transparent",
      },
      {
        id: 3,
        image: px(8583864),
        tone: "dark",
        eyebrow: "",
        titleLines: [
          { text: "Électroménager", className: "text-white font-bold" },
          { text: "à prix doux", className: "text-white font-light" },
        ],
        text: "Réfrigérateurs, ventilateurs, blenders et micro-ondes.",
        cta: { label: "Acheter", href: ROUTES.category("electromenager"), variant: "white" },
        overlay: "from-black/80 via-black/45 to-transparent",
      },
    ],
    brands: null,
    showcases: [
      { title: "Mode femme & homme", categorySlug: "mode-femme-homme", viewAllHref: ROUTES.category("mode-femme-homme"), related: ["mode-femme-homme", "beaute-sante", "bebe-enfants"] },
      { title: "Maison & cuisine", categorySlug: "maison-cuisine", viewAllHref: ROUTES.category("maison-cuisine"), related: ["maison-cuisine", "electromenager", "alimentation-boissons"] },
    ],
    columns: [{ categorySlug: "beaute-sante" }, { categorySlug: "electromenager" }, { categorySlug: "bebe-enfants" }],
    seo: {
      title: "Celebobo – la boutique en ligne de confiance au Kivu",
      paragraphs: [
        "Celebobo réunit au même endroit la mode, la maison et la cuisine, la beauté, l'alimentation, les articles pour bébé, l'électroménager et les téléphones. Chaque commande est suivie par un revendeur dédié avec lequel vous échangez directement dans l'application, de la confirmation à la livraison.",
        // {retour} : phrase sur le délai de retour, complétée avec les réglages du site (cf. HomeView)
        "Payez comme vous le souhaitez : Orange Money, Airtel Money, M-Pesa ou cash à la livraison.{retour} Notre service client vous accompagne avant et après votre achat.",
        "Devenez revendeur Celebobo, invitez vos proches avec votre code personnel et développez votre activité avec un catalogue complet, des prix compétitifs et des outils de suivi de vos ventes.",
      ],
    },
  };
  return { ...content, blocks: defaultBlocks(content.showcases, content.columns) };
}

/** Blocs par défaut (sans section dans le back-office) : les grands blocs, puis une rangée de colonnes. */
export function defaultBlocks(showcases: ShowcaseConfig[], columns: CategoryColumn[]): HomeBlock[] {
  return [
    ...showcases.map((showcase) => ({ kind: "showcase" as const, key: `s-${showcase.categorySlug}`, showcase })),
    ...(columns.length ? [{ kind: "columns" as const, key: "columns", columns }] : []),
  ];
}
