import { slugify } from "@/shared/lib/slug";
import type { Category } from "../types";

const img = (n: string) => `/images/products/${n}.jpg`;

/** `icon` = nom d'icône Iconsax (cf. modules/categories/components/CategoryIcon). */
export const MOCK_CATEGORIES: Category[] = [
  { id: 1, slug: slugify("Smartphones"), name: "Smartphones", description: "Les derniers smartphones, neufs et reconditionnés.", image: img("phone-android"), productsCount: 0, icon: "Mobile", active: true, order: 1 },
  { id: 2, slug: slugify("Ordinateurs"), name: "Ordinateurs", description: "Laptops, PC et tout-en-un pour le travail et le jeu.", image: img("laptop-neon"), productsCount: 0, icon: "Monitor", active: true, order: 2 },
  { id: 3, slug: slugify("Tablettes"), name: "Tablettes", description: "Tablettes tactiles et accessoires.", image: img("tablet"), productsCount: 0, icon: "Tablet", active: true, order: 3 },
  { id: 4, slug: slugify("Audio"), name: "Audio", description: "Casques, écouteurs et enceintes.", image: img("headphones-yellow"), productsCount: 0, icon: "Headphone", active: true, order: 4 },
  { id: 5, slug: slugify("Montres connectées"), name: "Montres connectées", description: "Montres et bracelets connectés.", image: img("watch-black"), productsCount: 0, icon: "Watch", active: true, order: 5 },
  { id: 6, slug: slugify("Gaming"), name: "Gaming", description: "Consoles, manettes et périphériques gaming.", image: img("console"), productsCount: 0, icon: "Game", active: true, order: 6 },
  { id: 7, slug: slugify("Chargeurs & accessoires"), name: "Chargeurs & accessoires", description: "Chargeurs, câbles et accessoires essentiels.", image: img("charger"), productsCount: 0, icon: "Flash", active: true, order: 7 },
  { id: 8, slug: slugify("Photo & vidéo"), name: "Photo & vidéo", description: "Appareils photo, objectifs et projecteurs.", image: img("camera"), productsCount: 0, icon: "Camera", active: true, order: 8 },
  { id: 9, slug: slugify("Bureau & impression"), name: "Bureau & impression", description: "Imprimantes et équipement de bureau.", image: img("printer"), productsCount: 0, icon: "Printer", active: true, order: 9 },
  { id: 10, slug: slugify("Périphériques"), name: "Périphériques", description: "Claviers, souris et écrans.", image: img("keyboard"), productsCount: 0, icon: "Keyboard", active: true, order: 10 },
];
