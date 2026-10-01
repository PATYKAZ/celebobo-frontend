import { MOCK_PRODUCTS } from "@/modules/products/mocks/products";
import type { PaymentMethod } from "@/modules/orders/types";
import type { Sale } from "../types";

const METHODS: PaymentMethod[] = ["OrangeMoney", "AirtelMoney", "M-Pesa", "Cash", "Cash", "M-Pesa"];
const BUYERS = ["Aline Mbuyi", "Chancelle Bakole", "Jonathan Luzolo", "Merveille Tuta", "Dieudonné Kasa", "Sarah Ilunga", "Héritier Mavungu"];
const SELLERS = [
  { id: 2, name: "Patrick Kabasele" },
  { id: 5, name: "Grâce Kalala" },
  null,
];

/** PRNG déterministe (LCG) → mêmes ventes à chaque chargement. */
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

function build(): Sale[] {
  const r = rng(42);
  return Array.from({ length: 60 }, (_, i) => {
    const p = MOCK_PRODUCTS[Math.floor(r() * MOCK_PRODUCTS.length)];
    const base = p.priceSolde ?? p.price;
    const priceFinal = Math.round(base * (0.93 + r() * 0.09));
    const buyer = BUYERS[Math.floor(r() * BUYERS.length)];
    const cost = p.pricePrimary ?? null;
    return {
      id: 600 - i,
      productId: p.id,
      productName: p.name,
      productImage: p.image,
      category: p.category,
      buyer: { id: 20 + (i % BUYERS.length), name: buyer },
      seller: SELLERS[Math.floor(r() * SELLERS.length)],
      dateAchat: new Date(Date.now() - (i * 1.5 + r()) * 86400000).toISOString(),
      priceFinal,
      pricePrimary: cost,
      profit: cost != null ? priceFinal - cost : priceFinal,
      method: METHODS[Math.floor(r() * METHODS.length)],
      venduA: r() > 0.5 ? buyer : null,
      orderId: r() > 0.7 ? 1 + Math.floor(r() * 8) : null,
    };
  });
}

/** Mutable (CRUD en mémoire). */
export const MOCK_SALES: Sale[] = build();
