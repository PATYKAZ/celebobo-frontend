import { ROUTES } from "@/config/routes";
import type { Brand, CategoryColumn, HomeBlock, HomeContent, ShowcaseConfig } from "./types";

const p = (n: string) => `/images/products/${n}.jpg`;
const h = (n: string) => `/images/hero/${n}.jpg`;

/** Marques connues : seules celles présentes dans le catalogue s'affichent (cf. home.mapper). */
export const BRANDS: Brand[] = [
  { name: "Apple", aliases: ["iPhone", "iPad", "MacBook", "AirPods"], className: "text-[26px] font-semibold tracking-tight", color: "#111" },
  { name: "SONY", className: "text-[22px] font-black tracking-[0.18em]", color: "#111" },
  { name: "JBL", className: "text-[28px] font-black italic", color: "#FF3300" },
  { name: "logitech", className: "text-[24px] font-bold lowercase tracking-tight", color: "#00B8FC" },
  { name: "hp", className: "text-[30px] font-extrabold lowercase", color: "#0096D6" },
  { name: "DELL", className: "text-[24px] font-black tracking-[0.12em]", color: "#007DB8" },
  { name: "Xiaomi", aliases: ["Redmi", "Poco"], className: "text-[24px] font-black tracking-tight", color: "#FF6900" },
  { name: "SAMSUNG", className: "text-[18px] font-black tracking-[0.2em]", color: "#1428A0" },
  { name: "Canon", className: "text-[26px] font-extrabold italic", color: "#CC0000" },
  { name: "HUAWEI", className: "text-[19px] font-bold tracking-[0.18em]", color: "#CF0A2C" },
  { name: "TECNO", className: "text-[22px] font-black tracking-[0.12em]", color: "#0072CE" },
  { name: "Infinix", className: "text-[24px] font-bold tracking-tight", color: "#2DB24A" },
  { name: "Lenovo", className: "text-[24px] font-bold tracking-tight", color: "#E2231A" },
  { name: "ANKER", className: "text-[22px] font-black tracking-[0.14em]", color: "#00A7E1" },
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
        image: h("hero-2"),
        tone: "dark",
        eyebrow: "Celebobo",
        titleLines: [
          { text: "Travaillez", className: "text-primary" },
          { text: "sans limites", className: "text-white" },
          { text: "avec le Mac", className: "text-white" },
        ],
        text: "Ordinateurs et smartphones neufs, livrés à Bukavu, à Goma et dans tout le pays.",
        cta: { label: "Découvrir", href: ROUTES.category("ordinateurs-portables"), variant: "primary" },
        overlay: "from-black/80 via-black/45 to-transparent",
      },
      {
        id: 2,
        image: p("gaming-setup"),
        tone: "dark",
        eyebrow: "Gaming",
        titleLines: [
          { text: "ÉQUIPEZ", className: "text-white font-normal" },
          { text: "VOTRE SETUP", className: "text-primary font-bold" },
        ],
        text: "Consoles, manettes et accessoires gaming.",
        cta: { label: "Acheter", href: ROUTES.category("gaming"), variant: "white" },
        overlay: "from-black/85 via-black/50 to-transparent",
      },
      {
        id: 3,
        image: h("hero-1"),
        tone: "light",
        eyebrow: "Audio",
        titleLines: [
          { text: "Casques", className: "sm:text-on-light font-bold" },
          { text: "sans fil", className: "sm:text-on-light font-light" },
        ],
        text: "Casques, écouteurs et enceintes sans fil.",
        cta: { label: "Acheter", href: ROUTES.category("audio"), variant: "dark" },
        overlay: "from-[#f4e6d0]/95 via-[#f4e6d0]/65 to-transparent",
      },
    ],
    brands: null,
    showcases: [
      { title: "Top smartphones & tablettes", categorySlug: "smartphones", viewAllHref: ROUTES.category("smartphones"), related: ["smartphones", "tablettes", "montres-connectees", "accessoires", "audio", "gaming"] },
      { title: "Meilleurs ordinateurs", categorySlug: "ordinateurs-portables", viewAllHref: ROUTES.category("ordinateurs-portables"), related: ["ordinateurs-portables", "tablettes", "accessoires", "audio", "gaming", "smartphones"] },
    ],
    columns: [{ categorySlug: "audio" }, { categorySlug: "gaming" }, { categorySlug: "montres-connectees" }],
    seo: {
      title: "Celebobo – la boutique high-tech de confiance en RD Congo",
      paragraphs: [
        "Celebobo vous propose une sélection de smartphones, ordinateurs, tablettes, casques, montres connectées et accessoires choisis pour leur fiabilité. Chaque commande est suivie par un revendeur dédié avec lequel vous échangez directement dans l'application, de la confirmation à la livraison.",
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
