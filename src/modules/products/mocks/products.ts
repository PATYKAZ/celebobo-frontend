import { MOCK_CATEGORIES } from "@/modules/categories/mocks/categories";
import type { Product, ProductVariant, VariantOption } from "../types";

const img = (n: string) => `/images/products/${n}.jpg`;
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

interface Seed {
  name: string;
  description: string;
  category: number;
  price: number;
  solde?: number;
  images: string[];
  rating: number | null;
  reviews: number;
  sales: number;
  age: number; // jours depuis l'ajout
  inStock?: boolean;
  freeShipping?: boolean;
  shippingFee?: number;
  cost: number; // prix d'achat (admin)
  features: string[];
  long?: string;
}

const LONG =
  "Un produit sélectionné et testé par l'équipe Celebobo. Garantie 12 mois, livraison rapide à Kinshasa et dans les grandes villes. Contactez un revendeur pour finaliser votre commande par Mobile Money ou cash à la livraison.";
const CARE = ["Éviter l'humidité et les chocs", "Nettoyer avec un chiffon doux et sec", "Utiliser uniquement les chargeurs d'origine"];

const SEEDS: Seed[] = [
  { name: "iPhone 11 Pro 256GB Gris Sidéral", description: "Smartphone premium qui offre un triple capteur photo et une autonomie exceptionnelle.", category: 1, price: 899, solde: 749, images: ["phone-dark", "phone-iphone"], rating: 4.8, reviews: 152, sales: 96, age: 6, cost: 620, features: ["Écran Super Retina XDR 5.8\"", "Triple caméra 12 MP", "Puce A13 Bionic", "Face ID"] },
  { name: "Xiaomi Mi 11 5G 128GB Noir", description: "Smartphone 5G qui dispose d'un écran AMOLED fluide 120 Hz et d'une charge rapide.", category: 1, price: 549, solde: 479, images: ["phone-android"], rating: 4.5, reviews: 88, sales: 120, age: 40, cost: 380, features: ["Écran AMOLED 6.8\"", "Snapdragon 888", "Charge 55W", "Caméra 108 MP"] },
  { name: "iPhone XS 64GB Argent — Reconditionné", description: "Smartphone reconditionné qui permet de profiter d'iOS à petit prix avec garantie.", category: 1, price: 449, images: ["phone-iphone"], rating: 4.2, reviews: 45, sales: 73, age: 90, cost: 310, features: ["Écran OLED 5.8\"", "Double caméra 12 MP", "Face ID", "Garantie 6 mois"] },
  { name: "Xiaomi Redmi Note 11 Pro 256GB", description: "Smartphone milieu de gamme qui offre une grande batterie et un écran 120 Hz.", category: 1, price: 329, solde: 279, images: ["phone-android", "phone-dark"], rating: 4.4, reviews: 210, sales: 240, age: 12, cost: 215, features: ["Écran AMOLED 120 Hz", "Batterie 5000 mAh", "Charge 67W", "256 Go"] },
  { name: "MacBook Pro 13'' M1 512GB Gris", description: "Ordinateur portable puissant qui intègre la puce M1 pour une autonomie record.", category: 2, price: 1599, solde: 1399, images: ["laptop-neon", "laptop-desk"], rating: 4.9, reviews: 64, sales: 41, age: 9, cost: 1180, features: ["Puce Apple M1", "16 Go RAM / 512 Go SSD", "Écran Retina 13.3\"", "Jusqu'à 20h d'autonomie"] },
  { name: "Dell XPS 13 9300 i7 16GB / 512GB", description: "Ultrabook élégant qui dispose d'un écran InfinityEdge quasi sans bordure.", category: 2, price: 1499, solde: 1329, images: ["laptop-ultra"], rating: 4.6, reviews: 38, sales: 33, age: 25, cost: 1050, features: ["Intel Core i7 10e gen", "16 Go RAM", "SSD 512 Go", "Écran 13.4\" FHD+"] },
  { name: "iMac 27'' 5K Retina 2020", description: "Ordinateur tout-en-un qui offre un écran 5K spectaculaire pour la création.", category: 2, price: 2199, images: ["monitor"], rating: 4.7, reviews: 19, sales: 14, age: 70, inStock: false, cost: 1700, features: ["Écran Retina 5K 27\"", "Intel Core i7", "32 Go RAM", "SSD 1 To"] },
  { name: "MacBook Air 13'' M1 256GB Argent", description: "Ordinateur ultra-léger qui permet de travailler toute la journée sans recharge.", category: 2, price: 1099, solde: 979, images: ["laptop-desk", "laptop-neon"], rating: 4.8, reviews: 112, sales: 88, age: 15, cost: 800, features: ["Puce M1 8 cœurs", "8 Go RAM / 256 Go", "Sans ventilateur", "Retina 13.3\""] },
  { name: "iPad Pro 12.9'' M1 128GB + Pencil", description: "Tablette professionnelle qui intègre un écran Liquid Retina XDR et la puce M1.", category: 3, price: 1099, solde: 969, images: ["tablet"], rating: 4.9, reviews: 57, sales: 52, age: 8, cost: 790, features: ["Écran Liquid Retina XDR", "Puce M1", "Compatible Apple Pencil 2", "Wi-Fi + Cellular"] },
  { name: "Casque Bluetooth BOSO Over-Ear Noir", description: "Casque sans fil qui offre une réduction de bruit active et 30 heures d'autonomie.", category: 4, price: 199, solde: 159, images: ["headphones-yellow", "hero-1"], rating: 4.5, reviews: 134, sales: 177, age: 4, cost: 105, features: ["Réduction de bruit active", "Bluetooth 5.0", "30h d'autonomie", "Micro intégré"] },
  { name: "Casque filaire Studio Sony MDR", description: "Casque filaire qui dispose de coussinets confortables et d'un son équilibré.", category: 4, price: 69, images: ["headphones-white"], rating: 4.1, reviews: 27, sales: 40, age: 120, cost: 38, features: ["Câble 1.2 m", "Pliable", "Haut-parleurs 40 mm", "Jack 3.5 mm"] },
  { name: "Enceinte JBL Flip 5 étanche", description: "Enceinte Bluetooth qui est étanche IPX7 et diffuse un son puissant partout.", category: 4, price: 129, solde: 99, images: ["speaker"], rating: 4.7, reviews: 301, sales: 260, age: 18, cost: 62, freeShipping: true, features: ["Étanche IPX7", "12h d'autonomie", "PartyBoost", "Bluetooth 4.2"] },
  { name: "Écouteurs sans fil TrueBuds Pro", description: "Écouteurs true wireless qui offrent un boîtier de charge compact et un son clair.", category: 4, price: 149, images: ["earbuds"], rating: 4.3, reviews: 76, sales: 98, age: 3, cost: 70, features: ["Bluetooth 5.2", "Boîtier de charge", "Résistants à la transpiration", "24h avec boîtier"] },
  { name: "Apple Watch Series 5 44mm Gris sidéral", description: "Montre connectée qui dispose d'un écran toujours actif et du suivi cardiaque.", category: 5, price: 449, solde: 399, images: ["watch-black"], rating: 4.6, reviews: 92, sales: 61, age: 30, cost: 290, features: ["Écran Always-On", "ECG & fréquence cardiaque", "GPS", "Étanche 50 m"] },
  { name: "Montre connectée Pulse Active Blanche", description: "Montre sportive qui permet de suivre vos activités et votre sommeil au quotidien.", category: 5, price: 99, images: ["watch-white"], rating: 4.0, reviews: 33, sales: 54, age: 11, cost: 45, freeShipping: true, features: ["Suivi du sommeil", "Notifications", "Autonomie 10 jours", "Étanche 5 ATM"] },
  { name: "PlayStation 4 Blanche 1To + manette", description: "Console de jeu qui propose un immense catalogue et une manette DualShock incluse.", category: 6, price: 399, solde: 349, images: ["console"], rating: 4.8, reviews: 188, sales: 134, age: 50, cost: 270, shippingFee: 4.98, features: ["Disque dur 1 To", "Manette DualShock 4", "Sortie HDMI 1080p", "Mode repos"] },
  { name: "Souris gaming Logitech G305 sans fil", description: "Souris légère qui offre un capteur HERO précis et une autonomie de 250 heures.", category: 6, price: 49, solde: 39, images: ["mouse"], rating: 4.6, reviews: 412, sales: 330, age: 22, cost: 22, freeShipping: true, features: ["Capteur HERO 12K", "Sans fil Lightspeed", "250h d'autonomie", "6 boutons"] },
  { name: "Clavier Magic sans fil Argent", description: "Clavier compact qui se connecte en Bluetooth et se recharge par Lightning.", category: 10, price: 129, images: ["keyboard"], rating: 4.4, reviews: 61, sales: 47, age: 60, cost: 78, features: ["Bluetooth", "Rechargeable", "Disposition AZERTY", "Design ultra-fin"] },
  { name: "Chargeur USB-C 61W + câble 2 m", description: "Chargeur rapide qui alimente laptops et smartphones avec un seul adaptateur.", category: 7, price: 79, solde: 59, images: ["charger"], rating: 4.5, reviews: 140, sales: 205, age: 2, cost: 30, freeShipping: true, features: ["61 W USB-C", "Câble 2 m inclus", "Compatible laptop/tablette", "Protection surtension"] },
  { name: "Appareil photo Sony Alpha a6000 + objectifs", description: "Hybride compact qui offre un autofocus rapide et trois objectifs pour tout photographier.", category: 8, price: 899, solde: 799, images: ["camera", "hero-3"], rating: 4.7, reviews: 29, sales: 18, age: 35, cost: 640, features: ["Capteur APS-C 24 MP", "Autofocus 179 points", "Vidéo Full HD", "3 objectifs inclus"] },
  { name: "Imprimante HP Color Laser MFP 178nw", description: "Imprimante multifonction qui permet d'imprimer, copier et scanner en couleur sans fil.", category: 9, price: 249, solde: 219, images: ["printer"], rating: 4.2, reviews: 22, sales: 26, age: 80, cost: 170, shippingFee: 2.98, features: ["Laser couleur", "Wi-Fi", "Impression / copie / scan", "18 ppm"] },
  { name: "Vidéoprojecteur Rétro Cinéma HD", description: "Projecteur qui dispose d'un faisceau lumineux puissant pour des soirées cinéma.", category: 8, price: 599, images: ["projector"], rating: null, reviews: 0, sales: 5, age: 5, cost: 380, features: ["Full HD", "3000 lumens", "HDMI / USB", "Haut-parleur intégré"] },
  { name: "Pack Home Office : laptop + enceinte + smartphone", description: "Pack complet qui regroupe un laptop, une enceinte et un smartphone pour télétravailler.", category: 2, price: 1999, solde: 1749, images: ["workspace", "laptop-desk"], rating: 4.6, reviews: 11, sales: 9, age: 14, cost: 1450, features: ["Laptop 14\"", "Enceinte Bluetooth", "Smartphone 128 Go", "Livraison offerte"] },
  { name: "Kit Setup Gaming : souris + clavier + casque", description: "Kit gaming qui permet de s'équiper d'un casque, d'un clavier et d'une souris.", category: 6, price: 229, solde: 189, images: ["gaming-setup", "hero-1"], rating: 4.3, reviews: 48, sales: 62, age: 7, cost: 120, freeShipping: true, features: ["Casque stéréo", "Clavier rétroéclairé", "Souris 7200 DPI", "Tapis offert"] },
];

/** Variantes (mêmes photos) pour peupler les listes / la pagination. */
const VARIANTS: Seed[] = [
  { ...SEEDS[0], name: "iPhone 11 Pro Max 512GB Or", price: 1099, solde: 949, sales: 58, reviews: 70, age: 55, cost: 760 },
  { ...SEEDS[1], name: "Xiaomi Mi 11 Lite 5G 64GB Bleu", price: 349, solde: undefined, sales: 150, reviews: 120, age: 100, cost: 230 },
  { ...SEEDS[4], name: "MacBook Pro 16'' M1 Pro 1TB", price: 2499, solde: 2299, sales: 19, reviews: 21, age: 17, cost: 1900 },
  { ...SEEDS[5], name: "Dell XPS 15 9500 i9 32GB / 1TB", price: 2199, solde: undefined, sales: 12, reviews: 9, age: 66, cost: 1650 },
  { ...SEEDS[8], name: "iPad Air 10.9'' 64GB Wi-Fi", price: 599, solde: 539, sales: 90, reviews: 84, age: 29, cost: 410 },
  { ...SEEDS[9], name: "Casque BOSO Studio Pro Edition Jaune", price: 229, solde: 189, sales: 66, reviews: 51, age: 45, cost: 120 },
  { ...SEEDS[11], name: "Écouteurs TrueBuds Lite Blancs", price: 79, solde: 59, sales: 140, reviews: 190, age: 1, cost: 31 },
  { ...SEEDS[15], name: "Souris gaming G305 Édition Blanche", price: 54, solde: undefined, sales: 101, reviews: 99, age: 13, cost: 24 },
  { ...SEEDS[17], name: "Chargeur voiture USB-C 45W Double", price: 29, solde: 24, sales: 80, reviews: 36, age: 20, cost: 10 },
  { ...SEEDS[13], name: "Montre connectée Pulse Max Noire", price: 129, solde: 109, sales: 71, reviews: 58, age: 33, cost: 58 },
];

const cat = (id: number) => MOCK_CATEGORIES.find((c) => c.id === id)!.name;

const daysAhead = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

/** Variantes de démonstration : smartphones (couleur × stockage), laptops (RAM/SSD), montres & casques (couleur). */
function buildVariants(s: Seed, id: number): { options: VariantOption[]; variants: ProductVariant[] } {
  let options: VariantOption[] = [];
  let deltas: Record<string, Record<string, number>> = {};
  if (s.category === 1) {
    options = [{ name: "Couleur", values: ["Noir", "Argent", "Bleu"] }, { name: "Stockage", values: ["128 Go", "256 Go"] }];
    deltas = { Stockage: { "128 Go": 0, "256 Go": 60 } };
  } else if (s.category === 2 && s.price < 1800) {
    options = [{ name: "Couleur", values: ["Gris", "Argent"] }, { name: "SSD", values: ["256 Go", "512 Go"] }];
    deltas = { SSD: { "256 Go": 0, "512 Go": 120 } };
  } else if (s.category === 4 || s.category === 5) {
    options = [{ name: "Couleur", values: ["Noir", "Blanc", "Jaune"] }];
  } else return { options: [], variants: [] };

  const combos: Record<string, string>[] = options.reduce<Record<string, string>[]>(
    (acc, o) => acc.flatMap((a) => o.values.map((v) => ({ ...a, [o.name]: v }))),
    [{}],
  );
  const variants = combos.map((attributes, i) => {
    const delta = Object.entries(attributes).reduce((sum, [k, v]) => sum + (deltas[k]?.[v] ?? 0), 0);
    return {
      id: id * 100 + i + 1,
      attributes,
      label: Object.values(attributes).join(" / "),
      price: delta ? s.price + delta : null,
      stock: s.inStock === false ? 0 : (id * 3 + i * 5) % 14,
      sku: `CB-${id}-${i + 1}`,
    };
  });
  return { options, variants };
}

function toProduct(s: Seed, id: number): Product {
  const v = buildVariants(s, id);
  const stock = s.inStock === false ? 0 : v.variants.length ? v.variants.reduce((n, x) => n + x.stock, 0) : 6 + ((id * 7) % 40);
  const imgs = s.images.map((n) => (n.startsWith("hero") ? `/images/hero/${n}.jpg` : img(n)));
  const onSale = s.solde != null && s.solde < s.price;
  return {
    id,
    name: s.name,
    description: s.description,
    longDescription: s.long ?? LONG,
    price: s.price,
    priceSolde: onSale ? (s.solde as number) : null,
    soldePercent: onSale ? Math.round(((s.price - (s.solde as number)) / s.price) * 10000) / 100 : null,
    pricePrimary: s.cost,
    category: cat(s.category),
    categoryId: s.category,
    image: imgs[0],
    images: imgs,
    badge: s.sales > 200 ? "Best-seller" : null,
    currentBadge: s.age <= 20 ? "Nouveauté" : s.sales > 200 ? "Best-seller" : "",
    rating: s.rating,
    reviewsCount: s.reviews,
    dateAdded: daysAgo(s.age),
    features: s.features,
    charaEntretienList: CARE,
    deliveryPolicyPhase1: "Livraison sous 24 à 48 h à Kinshasa après confirmation de la commande avec un revendeur.",
    deliveryPolicyPhase2: "Expédition en province sous 3 à 7 jours ouvrés. Paiement à la livraison ou par Mobile Money.",
    inStock: stock > 0,
    stock,
    stockThreshold: 5,
    dateWish: s.age > 30 ? daysAhead(20 + ((id * 11) % 90)) : null,
    variantOptions: v.options,
    variants: v.variants,
    deletedAt: null,
    isActive: true,
    freeShipping: s.freeShipping ?? false,
    shippingFee: s.shippingFee ?? null,
    salesCount: s.sales,
  };
}

export const MOCK_PRODUCTS: Product[] = [...SEEDS, ...VARIANTS].map((s, i) => toProduct(s, i + 1));

// Compte des produits par catégorie (mutation unique au chargement du module)
for (const c of MOCK_CATEGORIES) {
  c.productsCount = MOCK_PRODUCTS.filter((p) => p.categoryId === c.id).length;
}
