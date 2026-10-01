import type { Review } from "../types";

const NAMES: [string, string | null][] = [
  ["Patrick M.", "/images/avatars/avatar-1.jpg"],
  ["Grâce K.", "/images/avatars/avatar-2.jpg"],
  ["Jonathan L.", "/images/avatars/avatar-3.jpg"],
  ["Chancelle B.", null],
  ["Merveille T.", null],
];
const MSGS = [
  "Produit conforme à la description, livraison rapide. Je recommande vivement le vendeur.",
  "Très bon rapport qualité/prix. Le revendeur a été réactif sur la discussion.",
  "Bien emballé, fonctionne parfaitement depuis deux semaines. Rien à redire.",
  "Qualité au rendez-vous, un peu d'attente pour la livraison mais service client top.",
  "Excellent achat, je reviendrai pour d'autres produits !",
];

/** Avis déterministes par produit (3 à 5). */
export function mockReviewsFor(productId: number): Review[] {
  const count = 3 + (productId % 3);
  return Array.from({ length: count }, (_, i) => {
    const [name, avatar] = NAMES[(productId + i) % NAMES.length];
    return {
      id: productId * 100 + i,
      productId,
      user: { id: 50 + ((productId + i) % NAMES.length), name, avatar },
      rating: 5 - ((productId + i) % 3 === 0 ? 1 : 0),
      message: MSGS[(productId + i) % MSGS.length],
      dateCreated: new Date(Date.now() - (i * 6 + productId) * 86400000).toISOString(),
    };
  });
}
