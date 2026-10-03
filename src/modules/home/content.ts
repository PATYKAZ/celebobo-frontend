import { ROUTES } from "@/config/routes";
import type { HomeContent } from "./types";

const p = (n: string) => `/images/products/${n}.jpg`;
const h = (n: string) => `/images/hero/${n}.jpg`;

/**
 * Contenu éditorial de l'accueil (textes et visuels du design), propre au front.
 * Les liens pointent vers des catégories (slugs) ou des recherches, jamais vers des ids figés.
 * Les bannières gérées dans le back-office remplacent les slides (cf. home.service).
 */
export function buildHomeContent(): HomeContent {
  return {
    slides: [
      {
        id: 1,
        image: h("hero-2"),
        tone: "dark",
        eyebrow: "Celebobo Tech 2025",
        titleLines: [
          { text: "Travaillez", className: "text-primary" },
          { text: "sans limites", className: "text-white" },
          { text: "avec le Mac", className: "text-white" },
        ],
        text: "Découvrez la nouvelle génération d'ordinateurs et de smartphones à partir de $449.",
        cta: { label: "Découvrir", href: ROUTES.category("ordinateurs-portables"), variant: "primary" },
        overlay: "from-black/80 via-black/45 to-transparent",
      },
      {
        id: 2,
        image: p("gaming-setup"),
        tone: "dark",
        eyebrow: "Gaming",
        titleLines: [
          { text: "PACKS GAMING", className: "text-white font-normal" },
          { text: "JUSQU'À -50%", className: "text-primary font-bold" },
        ],
        text: "Consoles, casques, claviers et souris : équipez votre setup à prix réduit.",
        cta: { label: "Acheter", href: ROUTES.category("gaming"), variant: "white" },
        overlay: "from-black/85 via-black/50 to-transparent",
      },
      {
        id: 3,
        image: h("hero-1"),
        tone: "light",
        eyebrow: "Audio",
        titleLines: [
          { text: "Casques", className: "text-ink font-bold" },
          { text: "sans fil", className: "text-ink font-light" },
        ],
        bullets: ["Réduction de bruit active", "Bluetooth 5.0, micro intégré", "30 h d'autonomie"],
        cta: { label: "Acheter", href: ROUTES.category("audio"), variant: "dark" },
        overlay: "from-[#f4e6d0]/95 via-[#f4e6d0]/65 to-transparent",
      },
    ],
    miniBanners: [
      {
        id: 1,
        image: p("speaker"),
        tone: "light",
        lines: "Enceinte JBL Flip 5\nà partir de",
        highlight: "$99",
        highlightClass: "text-primary",
        cta: { label: "Découvrir", href: ROUTES.search("JBL Flip") },
        overlay: "from-white/95 via-white/70 to-transparent",
      },
      {
        id: 2,
        image: p("keyboard"),
        tone: "dark",
        lines: "Claviers & souris\nsans fil",
        highlight: "Dès $39",
        highlightClass: "text-sun-2",
        sub: "Compatibles tous appareils",
        overlay: "from-black/85 via-black/55 to-transparent",
      },
    ],
    promoCards: [
      {
        id: 1,
        image: p("watch-white"),
        tone: "light",
        eyebrow: "Pulse",
        title: "Montres connectées sport",
        cta: { label: "Acheter", href: ROUTES.category("montres-connectees") },
        overlay: "from-[#eceef2]/95 via-[#eceef2]/50 to-transparent",
      },
      {
        id: 2,
        image: p("phone-dark"),
        tone: "dark",
        eyebrow: "iPhone",
        title: "11 PRO\nGris sidéral",
        from: "À partir de",
        price: "$749",
        cta: { label: "Acheter", href: ROUTES.search("iPhone") },
        overlay: "from-black/80 via-black/40 to-transparent",
      },
    ],
    brands: [
      { name: "Apple", className: "text-[26px] font-semibold tracking-tight", color: "#111" },
      { name: "SONY", className: "text-[22px] font-black tracking-[0.18em]", color: "#111" },
      { name: "JBL", className: "text-[28px] font-black italic", color: "#FF3300" },
      { name: "logitech", className: "text-[24px] font-bold lowercase tracking-tight", color: "#00B8FC" },
      { name: "hp", className: "text-[30px] font-extrabold lowercase", color: "#0096D6" },
      { name: "DELL", className: "text-[24px] font-black tracking-[0.12em]", color: "#007DB8" },
      { name: "mi", className: "text-[28px] font-black lowercase", color: "#FF6900" },
      { name: "SAMSUNG", className: "text-[18px] font-black tracking-[0.2em]", color: "#1428A0" },
      { name: "Canon", className: "text-[26px] font-extrabold italic", color: "#CC0000" },
      { name: "HUAWEI", className: "text-[19px] font-bold tracking-[0.18em]", color: "#CF0A2C" },
    ],
    sideBanners: [
      { id: 1, image: p("laptop-neon"), eyebrow: "Nouveau", title: "MacBook Pro M1\nà partir de $1,399", href: ROUTES.search("MacBook") },
      { id: 2, image: p("earbuds"), eyebrow: "Audio", title: "Écouteurs sans fil\ndès $59", href: ROUTES.category("audio") },
      { id: 3, image: p("console"), eyebrow: "Gaming", title: "PlayStation 4\n$349", href: ROUTES.search("PlayStation") },
    ],
    editorial: [
      { id: 1, image: p("workspace"), title: "Pack Home Office complet", text: "Laptop, enceinte et smartphone pour télétravailler sereinement.", href: ROUTES.search("Home Office") },
      { id: 2, image: p("gaming-setup"), title: "Soldes jusqu'à -50 % sur le gaming", text: "Offre limitée. Dépêchez-vous !", href: ROUTES.category("gaming") },
      { id: 3, image: p("camera"), title: "Photo : Sony Alpha a6000 + 3 objectifs", text: "Hybride compact, autofocus ultra rapide, parfait pour débuter.", href: ROUTES.search("Sony Alpha") },
      { id: 4, image: p("tablet"), title: "iPad Pro 12.9'' M1 — la puissance en main", text: "Dès $969 avec Apple Pencil compatible. Livraison offerte.", href: ROUTES.search("iPad Pro") },
    ],
    showcases: [
      {
        title: "Top smartphones & tablettes",
        categorySlug: "smartphones",
        viewAllHref: ROUTES.category("smartphones"),
        banner: {
          image: p("phone-android"),
          title: ["REDMI NOTE", "11 PRO 5G"],
          text: "Relevez le défi : écran 120 Hz, charge 67W.",
          cta: "Acheter",
          tone: "light",
          overlay: "from-[#f3f4f8] via-[#f3f4f8]/80 to-transparent",
        },
        subCategories: [
          { name: "iPhone (iOS)", count: 4, image: p("phone-iphone"), href: ROUTES.category("smartphones") },
          { name: "Android", count: 5, image: p("phone-android"), href: ROUTES.category("smartphones") },
          { name: "Support 5G", count: 3, image: p("phone-dark"), href: ROUTES.category("smartphones") },
          { name: "Tablettes", count: 2, image: p("tablet"), href: ROUTES.category("tablettes") },
          { name: "Xiaomi", count: 3, image: p("phone-android"), href: ROUTES.category("smartphones") },
          { name: "Accessoires", count: 3, image: p("charger"), href: ROUTES.category("accessoires") },
        ],
      },
      {
        title: "Meilleurs ordinateurs",
        categorySlug: "ordinateurs-portables",
        viewAllHref: ROUTES.category("ordinateurs-portables"),
        banner: {
          image: p("laptop-neon"),
          title: ["MacBook Pro", "puce M1"],
          text: "À partir de $1,399 — puissance et autonomie.",
          cta: "Acheter",
          price: "$1,399",
          tone: "dark",
          overlay: "from-black/85 via-black/55 to-transparent",
        },
        subCategories: [
          { name: "MacBook", count: 4, image: p("laptop-desk"), href: ROUTES.category("ordinateurs-portables") },
          { name: "Ultrabooks", count: 3, image: p("laptop-ultra"), href: ROUTES.category("ordinateurs-portables") },
          { name: "Tout-en-un", count: 2, image: p("monitor"), href: ROUTES.category("ordinateurs-portables") },
          { name: "Packs bureau", count: 2, image: p("workspace"), href: ROUTES.category("ordinateurs-portables") },
          { name: "Claviers", count: 2, image: p("keyboard"), href: ROUTES.category("accessoires") },
          { name: "Souris", count: 2, image: p("mouse"), href: ROUTES.category("accessoires") },
        ],
      },
    ],
    columns: [
      {
        title: "Audio & photo",
        href: ROUTES.category("audio"),
        banner: { image: p("speaker"), lines: ["Meilleures", "enceintes", "2025"], tone: "dark", overlay: "from-black/80 via-black/40 to-transparent" },
        items: [
          { name: "Enceintes", count: 2, image: p("speaker"), href: ROUTES.category("audio") },
          { name: "Appareils photo", count: 1, image: p("camera"), href: ROUTES.search("photo") },
          { name: "Écouteurs", count: 3, image: p("earbuds"), href: ROUTES.category("audio") },
          { name: "Casques", count: 4, image: p("headphones-yellow"), href: ROUTES.category("audio") },
        ],
      },
      {
        title: "Gaming",
        href: ROUTES.category("gaming"),
        banner: { image: p("gaming-setup"), lines: ["SOURIS", "GAMING", "SANS FIL"], tone: "dark", overlay: "from-black/80 via-black/45 to-transparent" },
        items: [
          { name: "Consoles", count: 1, image: p("console"), href: ROUTES.category("gaming") },
          { name: "Souris", count: 3, image: p("mouse"), href: ROUTES.category("accessoires") },
          { name: "Claviers", count: 2, image: p("keyboard"), href: ROUTES.category("accessoires") },
          { name: "Casques gaming", count: 2, image: p("headphones-white"), href: ROUTES.category("audio") },
        ],
      },
      {
        title: "Équipement bureau",
        href: ROUTES.search("imprimante"),
        banner: { image: p("projector"), lines: ["Home cinéma 4K", "Vidéoprojecteur"], tone: "dark", overlay: "from-black/80 via-black/45 to-transparent" },
        items: [
          { name: "Imprimantes", count: 1, image: p("printer"), href: ROUTES.search("imprimante") },
          { name: "Écrans", count: 2, image: p("monitor"), href: ROUTES.category("ordinateurs-portables") },
          { name: "Chargeurs", count: 3, image: p("charger"), href: ROUTES.category("accessoires") },
          { name: "Projecteurs", count: 1, image: p("projector"), href: ROUTES.search("photo") },
        ],
      },
    ],
    dealEndsAt: new Date(Date.now() + (2 * 86400 + 5 * 3600 + 17 * 60) * 1000).toISOString(),
    dealSold: { sold: 26, total: 75 },
    seo: {
      title: "Celebobo – la boutique high-tech de confiance en RD Congo",
      paragraphs: [
        "Celebobo vous propose une sélection de smartphones, ordinateurs, tablettes, casques, montres connectées et accessoires choisis pour leur fiabilité. Chaque commande est suivie par un revendeur dédié avec lequel vous échangez directement dans l'application, de la confirmation à la livraison.",
        "Payez comme vous le souhaitez : Orange Money, Airtel Money, M-Pesa ou cash à la livraison. Nos produits bénéficient d'une garantie, d'un retour sous 30 jours et d'un service client disponible 24 h/24 et 7 j/7 pour vous accompagner avant et après votre achat.",
        "Devenez revendeur Celebobo, invitez vos proches avec votre code personnel et développez votre activité avec un catalogue complet, des prix compétitifs et des outils de suivi de vos ventes.",
      ],
    },
  };
}
