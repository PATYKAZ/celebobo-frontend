import type { Category } from "../types";

const img = (n: string) => `/images/products/${n}.jpg`;

/** `icon` = nom d'icône Iconsax (cf. modules/categories/components/CategoryIcon). */
export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: "Smartphones", description: "Les derniers smartphones, neufs et reconditionnés.", image: img("phone-android"), productsCount: 0, icon: "Mobile" },
  { id: 2, name: "Ordinateurs", description: "Laptops, PC et tout-en-un pour le travail et le jeu.", image: img("laptop-neon"), productsCount: 0, icon: "Monitor" },
  { id: 3, name: "Tablettes", description: "Tablettes tactiles et accessoires.", image: img("tablet"), productsCount: 0, icon: "Tablet" },
  { id: 4, name: "Audio", description: "Casques, écouteurs et enceintes.", image: img("headphones-yellow"), productsCount: 0, icon: "Headphone" },
  { id: 5, name: "Montres connectées", description: "Montres et bracelets connectés.", image: img("watch-black"), productsCount: 0, icon: "Watch" },
  { id: 6, name: "Gaming", description: "Consoles, manettes et périphériques gaming.", image: img("console"), productsCount: 0, icon: "Game" },
  { id: 7, name: "Chargeurs & accessoires", description: "Chargeurs, câbles et accessoires essentiels.", image: img("charger"), productsCount: 0, icon: "Flash" },
  { id: 8, name: "Photo & vidéo", description: "Appareils photo, objectifs et projecteurs.", image: img("camera"), productsCount: 0, icon: "Camera" },
  { id: 9, name: "Bureau & impression", description: "Imprimantes et équipement de bureau.", image: img("printer"), productsCount: 0, icon: "Printer" },
  { id: 10, name: "Périphériques", description: "Claviers, souris et écrans.", image: img("keyboard"), productsCount: 0, icon: "Keyboard" },
];
