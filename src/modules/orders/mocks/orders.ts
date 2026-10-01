import { MOCK_PRODUCTS } from "@/modules/products/mocks/products";
import type { Order, OrderItem, OrderStatus } from "../types";

const daysAgo = (d: number, h = 0) => new Date(Date.now() - d * 86400000 - h * 3600000).toISOString();

const BUYERS = [
  { id: 1, name: "Aline Mbuyi", email: "client@celebobo.com" },
  { id: 11, name: "Chancelle Bakole", email: "chancelle@mail.com" },
  { id: 12, name: "Jonathan Luzolo", email: "jonathan@mail.com" },
  { id: 13, name: "Merveille Tuta", email: "merveille@mail.com" },
];
const RESELLERS = [
  { id: 2, name: "Patrick Kabasele" },
  { id: 5, name: "Grâce Kalala" },
];

function items(startId: number, picks: [number, number][]): OrderItem[] {
  return picks.map(([productId, quantity], i) => {
    const p = MOCK_PRODUCTS.find((x) => x.id === productId)!;
    return {
      id: startId + i,
      productId: p.id,
      productName: p.name,
      productImage: p.image,
      quantity,
      unitPrice: p.priceSolde ?? p.price,
    };
  });
}

function order(id: number, buyer: number, status: OrderStatus, age: number, picks: [number, number][], reseller?: number): Order {
  const its = items(id * 10, picks);
  return {
    id,
    createdAt: daysAgo(age, id),
    status,
    totalPrice: its.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    items: its,
    user: BUYERS[buyer],
    assignedRevendeur: reseller != null ? RESELLERS[reseller] : null,
    conversationId: id,
  };
}

/**
 * Commandes de démonstration, partagées par l'espace client (modules/orders, account)
 * et le back-office (modules/admin/orders). Tableau MUTABLE : les services mock le modifient en mémoire.
 */
export const MOCK_ORDERS: Order[] = [
  order(1, 0, "terminé", 34, [[1, 1], [20, 1]], 0),
  order(2, 0, "traitement", 6, [[10, 1], [13, 1]], 0),
  order(3, 1, "attente", 1, [[9, 1]]),
  order(4, 2, "traitement", 3, [[5, 1], [19, 1]], 1),
  order(5, 3, "terminé", 21, [[16, 1], [17, 2]], 1),
  order(6, 0, "attente", 0, [[14, 1], [19, 2]]),
  order(7, 1, "terminé", 48, [[22, 1]], 0),
  order(8, 2, "attente", 0, [[12, 1], [18, 1], [21, 1]]),
];

export const MOCK_RESELLERS_LITE = RESELLERS;
