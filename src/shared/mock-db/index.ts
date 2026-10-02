import { MOCK_PRODUCTS } from "@/modules/products/mocks/products";
import { MOCK_CATEGORIES } from "@/modules/categories/mocks/categories";
import type { Order, OrderItem, OrderStatus, OrderStatusEvent, PaymentMethod } from "@/modules/orders/types";
import { DAY, daysAgo, rng } from "./rng";
import type { DbAddress, DbAuditEntry, DbCommissionPayment, DbSale, DbStockMovement, DbUser } from "./types";

export * from "./types";
export { daysAgo, DAY } from "./rng";

/**
 * BASE DE DÉMO UNIQUE — source de vérité de tous les écrans en mode mock
 * (tableau de bord, ventes, commandes, revendeurs, commissions, analytique, messagerie, espace client).
 * Les services mock LISENT et MUTENT ces tableaux : ainsi les chiffres concordent partout.
 * En mode API réel, ce module n'est plus utilisé.
 */

const r = rng(20261001);

const FIRST = ["Patrick", "Grâce", "Jonathan", "Chancelle", "Merveille", "Dieudonné", "Aline", "Joël", "Prisca", "Fabrice", "Sarah", "Héritier", "Nadège", "Trésor", "Gloria", "Christian", "Béni", "Esther", "Rodrigue", "Naomie", "Samuel", "Ruth", "Michel", "Lydie", "Jacques", "Divine", "Olivier", "Rachel", "Cédric", "Josué"];
const LAST = ["Kabasele", "Kalala", "Luzolo", "Bakole", "Tuta", "Mpia", "Mbuyi", "Tshimanga", "Ilunga", "Mukendi", "Kasongo", "Ngoma", "Mwamba", "Lukusa", "Nsimba", "Kitoko", "Mavungu", "Zola", "Banza", "Kimbala", "Lwamba", "Mutombo", "Kanyinda", "Bompeka"];
const AVATARS = ["/images/avatars/avatar-1.jpg", "/images/avatars/avatar-2.jpg", "/images/avatars/avatar-3.jpg"];
const STREETS = ["Av. de la Libération", "Av. Kasa-Vubu", "Av. du Commerce", "Av. Lumumba", "Av. Tombalbaye", "Av. des Huileries", "Av. Kabinda"];
const QUARTERS = ["Gombe", "Ngaliema", "Limete", "Bandalungwa", "Lingwala", "Kintambo", "Masina", "Ma Campagne"];

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ".");
const phone = () => `+243 ${r.pick(["81", "82", "97", "99", "85"])} ${r.int(100, 999)} ${r.int(100, 999)}`;

// ───────────────────────────── Utilisateurs ─────────────────────────────
const users: DbUser[] = [];
const mk = (u: Partial<DbUser> & Pick<DbUser, "id" | "firstName" | "lastName" | "role">): DbUser => ({
  username: slug(`${u.firstName}.${u.lastName}`),
  email: `${slug(`${u.firstName}.${u.lastName}`)}@mail.com`,
  avatar: null,
  phoneNumber: phone(),
  joinedAt: daysAgo(r.int(30, 900)),
  active: true,
  invitedBy: null,
  ...u,
});

// Équipe (comptes démo cohérents avec modules/auth/mocks/users.ts)
users.push(
  mk({ id: 4, firstName: "Célestin", lastName: "Admin", role: "admin", username: "admin", email: "admin@celebobo.com", avatar: AVATARS[2], joinedAt: daysAgo(1100) }),
  mk({ id: 3, firstName: "Joël", lastName: "Tshimanga", role: "mukubwa", username: "mukubwa", email: "mukubwa@celebobo.com", avatar: AVATARS[2], joinedAt: daysAgo(1000) }),
);

// 23 revendeurs : ids 2 et 5 = comptes connus ; 20..40 les autres
const RESELLER_IDS = [2, 5, ...Array.from({ length: 21 }, (_, i) => 20 + i)];
const usedNames = new Set<string>(["Patrick Kabasele", "Grâce Kalala", "Joël Tshimanga", "Aline Mbuyi", "Chancelle Bakole", "Jonathan Luzolo", "Merveille Tuta"]);
const uniqueName = () => {
  for (;;) {
    const n = `${r.pick(FIRST)} ${r.pick(LAST)}`;
    if (!usedNames.has(n)) {
      usedNames.add(n);
      return n.split(" ") as [string, string];
    }
  }
};
const usedCodes = new Set<string>(["4821", "5513"]);
const code = () => {
  for (;;) {
    const c = String(r.int(1000, 9999));
    if (!usedCodes.has(c)) return usedCodes.add(c), c;
  }
};

RESELLER_IDS.forEach((id, i) => {
  if (id === 2)
    users.push(mk({ id, firstName: "Patrick", lastName: "Kabasele", role: "revendeur", username: "revendeur", email: "revendeur@celebobo.com", avatar: AVATARS[0], codeRevendeur: "4821", availability: "online", commissionRate: 0.07, joinedAt: daysAgo(640) }));
  else if (id === 5)
    users.push(mk({ id, firstName: "Grâce", lastName: "Kalala", role: "revendeur", avatar: AVATARS[1], codeRevendeur: "5513", availability: "away", commissionRate: 0.08, joinedAt: daysAgo(520) }));
  else {
    const [f, l] = uniqueName();
    users.push(
      mk({
        id,
        firstName: f,
        lastName: l,
        role: "revendeur",
        avatar: i % 4 === 0 ? AVATARS[i % 3] : null,
        codeRevendeur: code(),
        availability: r.pick(["online", "online", "away", "offline"] as const),
        commissionRate: r.pick([0.05, 0.06, 0.07, 0.08, 0.1]),
        active: id !== 33 && id !== 38,
        joinedAt: daysAgo(r.int(40, 700)),
      }),
    );
  }
});

// Clients : 1 (démo), 11, 12, 13 (commandes d'exemple) + 90 générés
const CLIENT_FIXED: [number, string, string, string | null, number | null][] = [
  [1, "Aline", "Mbuyi", AVATARS[1], 2],
  [11, "Chancelle", "Bakole", null, 2],
  [12, "Jonathan", "Luzolo", null, 5],
  [13, "Merveille", "Tuta", null, null],
];
for (const [id, f, l, avatar, invitedBy] of CLIENT_FIXED) {
  users.push(mk({ id, firstName: f, lastName: l, role: "client", avatar, invitedBy, ...(id === 1 ? { username: "client", email: "client@celebobo.com" } : {}) }));
}
const activeResellerIds = RESELLER_IDS.filter((id) => id !== 33 && id !== 38);
for (let id = 100; id < 190; id++) {
  const [f, l] = uniqueName();
  // pondération : 2 et 5 ont davantage d'invités
  const roll = r.next();
  const invitedBy = roll < 0.16 ? 2 : roll < 0.4 ? 5 : roll < 0.85 ? r.pick(activeResellerIds) : null;
  users.push(mk({ id, firstName: f, lastName: l, role: "client", invitedBy, joinedAt: daysAgo(r.int(1, 400)) }));
}

const userById = (id: number) => users.find((u) => u.id === id);
const fullName = (u: Pick<DbUser, "firstName" | "lastName">) => `${u.firstName} ${u.lastName}`;

// ───────────────────────────── Commandes ─────────────────────────────
const METHODS: PaymentMethod[] = ["OrangeMoney", "AirtelMoney", "M-Pesa", "Cash"];
const SYSTEM = { id: 0, name: "Système", role: "system" as const };
const clients = users.filter((u) => u.role === "client");

const itemOf = (orderId: number, i: number, productId: number, quantity: number): OrderItem => {
  const p = MOCK_PRODUCTS.find((x) => x.id === productId)!;
  return { id: orderId * 10 + i, productId: p.id, productName: p.name, productImage: p.image, quantity, unitPrice: p.priceSolde ?? p.price, variantLabel: p.variants[0]?.label ?? null };
};

/** Parcours d'historique jusqu'à `status` (horodaté depuis `createdAt`). */
function historyUntil(createdAt: string, status: OrderStatus, buyer: DbUser, seller: DbUser | null): OrderStatusEvent[] {
  const t0 = new Date(createdAt).getTime();
  const FLOW: OrderStatus[] = ["attente", "assignee", "confirmee", "payee", "en_livraison", "livree"];
  const path: OrderStatus[] =
    status === "annulee" ? ["attente", "assignee", "annulee"] : status === "retournee" ? [...FLOW, "retournee"] : FLOW.slice(0, FLOW.indexOf(status) + 1);
  const mgr = userById(3)!;
  return path.map((s, i) => {
    const by =
      s === "attente" ? { id: buyer.id, name: fullName(buyer), role: "client" as const }
      : s === "assignee" ? { id: mgr.id, name: fullName(mgr), role: "mukubwa" as const }
      : s === "annulee" ? { id: buyer.id, name: fullName(buyer), role: "client" as const }
      : seller ? { id: seller.id, name: fullName(seller), role: "revendeur" as const }
      : SYSTEM;
    return { status: s, at: new Date(t0 + i * (3 + (i % 3)) * 3600000).toISOString(), by, note: s === "annulee" ? "Changement d'avis" : null };
  });
}

function buildOrder(id: number, buyerId: number, status: OrderStatus, ageDays: number, picks: [number, number][], resellerId: number | null): Order {
  const buyer = userById(buyerId)!;
  const seller = resellerId != null ? userById(resellerId)! : null;
  const createdAt = daysAgo(ageDays, id % 9);
  const items = picks.map(([pid, q], i) => itemOf(id, i, pid, q));
  const finished = status === "livree" || status === "retournee";
  return {
    id,
    createdAt,
    status,
    totalPrice: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    items,
    user: { id: buyer.id, name: fullName(buyer), email: buyer.email, phone: buyer.phoneNumber },
    assignedRevendeur: seller ? { id: seller.id, name: fullName(seller) } : null,
    conversationId: id,
    statusHistory: historyUntil(createdAt, status, buyer, seller),
    deliveryAddress: `${r.pick(STREETS)} n°${r.int(1, 120)}, ${r.pick(QUARTERS)}, Kinshasa`,
    paymentMethod: r.pick(METHODS),
    note: r.chance(0.25) ? r.pick(["Livraison après 17 h svp.", "Appelez avant de passer.", "Emballage cadeau si possible.", "Je suis disponible le week-end."]) : null,
    convertedToSales: finished,
    cancelReason: status === "annulee" ? "Changement d'avis" : null,
  };
}

const orders: Order[] = [
  // 8 commandes « historiques » (ids stables : la messagerie y rattache ses conversations)
  buildOrder(1, 1, "livree", 34, [[1, 1], [20, 1]], 2),
  buildOrder(2, 1, "confirmee", 6, [[10, 1], [13, 1]], 2),
  buildOrder(3, 11, "attente", 1, [[9, 1]], null),
  buildOrder(4, 12, "payee", 3, [[5, 1], [19, 1]], 5),
  buildOrder(5, 13, "livree", 21, [[16, 1], [17, 2]], 5),
  buildOrder(6, 1, "attente", 0, [[14, 1], [19, 2]], null),
  buildOrder(7, 11, "livree", 48, [[22, 1]], 2),
  buildOrder(8, 12, "attente", 0, [[12, 1], [18, 1], [21, 1]], null),
];
for (let id = 9; id <= 56; id++) {
  const age = r.int(0, 88);
  const status: OrderStatus =
    age > 20
      ? r.pick(["livree", "livree", "livree", "livree", "annulee", "retournee", "livree"] as const)
      : age > 8
        ? r.pick(["livree", "en_livraison", "payee", "confirmee", "annulee"] as const)
        : r.pick(["attente", "attente", "assignee", "confirmee", "payee", "en_livraison"] as const);
  const unassigned = status === "attente" && r.chance(0.8);
  const picks: [number, number][] = Array.from({ length: r.int(1, 3) }, () => [r.int(1, MOCK_PRODUCTS.length), r.int(1, 2)] as [number, number]);
  // doublons de produit dans une même commande → on dédoublonne
  const uniq = [...new Map(picks.map((p) => [p[0], p])).values()];
  orders.push(buildOrder(id, r.pick(clients).id, status, age, uniq, unassigned ? null : r.pick(activeResellerIds)));
}
orders.sort((a, b) => a.id - b.id);

// ───────────────────────────── Ventes ─────────────────────────────
const sales: DbSale[] = [];
let saleSeq = 1;
for (const o of orders) {
  if (o.status !== "livree" && o.status !== "retournee") continue;
  const done = o.statusHistory.find((h) => h.status === "livree")?.at ?? o.createdAt;
  for (const it of o.items) {
    sales.push({
      id: saleSeq++, productId: it.productId!, sellerId: o.assignedRevendeur!.id, buyerId: o.user.id, soldTo: o.user.name,
      quantity: it.quantity, unitPrice: it.unitPrice, method: o.paymentMethod ?? "Cash", soldAt: done, recordedAt: done, orderId: o.id,
      status: o.status === "retournee" ? "retournée" : "valide",
      refund: o.status === "retournee" ? { amount: it.unitPrice * it.quantity, reason: "Produit retourné par le client", at: done, by: 3 } : null,
    });
  }
}
// ventes directes (hors commande) : revendeurs + responsable
const sellers = [...activeResellerIds, 3];
for (let i = 0; i < 110; i++) {
  const p = r.pick(MOCK_PRODUCTS);
  const when = daysAgo(r.int(0, 89), r.int(0, 20));
  const refunded = i % 37 === 5;
  const unitPrice = Math.round((p.priceSolde ?? p.price) * (0.92 + r.next() * 0.08));
  const qty = r.int(1, 2);
  sales.push({
    id: saleSeq++, productId: p.id, sellerId: r.chance(0.35) ? 2 : r.chance(0.3) ? 5 : r.pick(sellers), buyerId: null,
    soldTo: r.chance(0.7) ? `${r.pick(FIRST)} ${r.pick(LAST)}` : null, quantity: qty, unitPrice, method: r.pick(METHODS), soldAt: when, recordedAt: when,
    orderId: null, status: refunded ? "remboursée" : "valide",
    refund: refunded ? { amount: unitPrice * qty, reason: "Produit défectueux", at: when, by: 4 } : null,
  });
}
sales.sort((a, b) => +new Date(b.soldAt) - +new Date(a.soldAt));

// ───────────────────────────── Commissions ─────────────────────────────
const commissionPayments: DbCommissionPayment[] = [];
{
  let pid = 1;
  for (const rid of RESELLER_IDS) {
    const u = userById(rid)!;
    const earned = sales.filter((s) => s.sellerId === rid && s.status === "valide").reduce((n, s) => n + s.unitPrice * s.quantity * (u.commissionRate ?? 0.07), 0);
    if (earned < 20) continue;
    const parts = r.int(1, 2);
    for (let k = 0; k < parts; k++) {
      commissionPayments.push({ id: pid++, resellerId: rid, amount: Math.round((earned * (0.35 + 0.25 * k)) * 100) / 100, paidAt: daysAgo(r.int(5, 70)), note: k ? "Solde partiel" : "Paiement mensuel", paidBy: 4 });
    }
  }
}

// ───────────────────────────── Stock, audit, adresses ─────────────────────────────
const stockMovements: DbStockMovement[] = [];
{
  let sid = 1;
  for (const p of MOCK_PRODUCTS) {
    stockMovements.push({ id: sid++, productId: p.id, at: daysAgo(150), delta: p.stock + 20, reason: "inventaire", by: { id: 4, name: "Célestin Admin" }, note: "Inventaire initial", balanceAfter: p.stock + 20 });
    const sold = sales.filter((s) => s.productId === p.id && s.status === "valide").slice(0, 3);
    let bal = p.stock + 20;
    for (const s of sold) {
      bal -= s.quantity;
      stockMovements.push({ id: sid++, productId: p.id, at: s.soldAt, delta: -s.quantity, reason: "vente", by: { id: s.sellerId, name: fullName(userById(s.sellerId)!) }, note: s.orderId ? `Commande #${s.orderId}` : null, balanceAfter: bal });
    }
    stockMovements.push({ id: sid++, productId: p.id, at: daysAgo(30), delta: 0, reason: "correction", by: { id: 3, name: "Joël Tshimanga" }, note: "Contrôle de stock", balanceAfter: p.stock });
  }
  stockMovements.sort((a, b) => +new Date(b.at) - +new Date(a.at));
}

const auditLog: DbAuditEntry[] = [];
{
  const A: DbAuditEntry["actor"] = { id: 4, name: "Célestin Admin", role: "admin" };
  const M: DbAuditEntry["actor"] = { id: 3, name: "Joël Tshimanga", role: "mukubwa" };
  const rows: [DbAuditEntry["actor"], string, DbAuditEntry["entity"], number, string, DbAuditEntry["diff"]?][] = [
    [M, "Prix modifié", "produit", 4, "Xiaomi Redmi Note 11 Pro : prix de vente", [{ field: "price", from: 349, to: 329 }]],
    [A, "Produit supprimé", "produit", 31, "Mise à la corbeille : « Casque BOSO Studio Pro »"],
    [M, "Commande assignée", "commande", 4, "Commande #4 assignée à Grâce Kalala"],
    [A, "Vente remboursée", "vente", 12, "Remboursement de $189.00 — produit défectueux"],
    [M, "Statut modifié", "commande", 5, "Commande #5 : en livraison → livrée", [{ field: "status", from: "en_livraison", to: "livree" }]],
    [A, "Revendeur désactivé", "revendeur", 33, "Compte revendeur #33 désactivé"],
    [A, "Commission payée", "commission", 2, "Paiement de commission à Patrick Kabasele"],
    [M, "Stock ajusté", "stock", 12, "Enceinte JBL Flip 5 : +12 (réapprovisionnement)"],
    [A, "Rôle modifié", "utilisateur", 21, "Rôle : client → revendeur"],
    [M, "Prix modifié", "produit", 17, "PlayStation 4 : prix soldé", [{ field: "priceSolde", from: 369, to: 349 }]],
  ];
  rows.forEach(([actor, action, entity, entityId, summary, diff], i) => auditLog.push({ id: i + 1, at: daysAgo(i * 3 + 1, i), actor, action, entity, entityId, summary, diff }));
}

const addresses: DbAddress[] = [
  { id: 1, userId: 1, label: "Domicile", recipient: "Aline Mbuyi", phone: "+243 990 112 233", line1: "Av. de la Libération n°24", quarter: "Gombe", city: "Kinshasa", country: "RD Congo", isDefault: true },
  { id: 2, userId: 1, label: "Bureau", recipient: "Aline Mbuyi", phone: "+243 990 112 233", line1: "Av. du Commerce n°8", quarter: "Limete", city: "Kinshasa", country: "RD Congo", isDefault: false },
];

export const DB = {
  users,
  orders,
  sales,
  commissionPayments,
  stockMovements,
  auditLog,
  addresses,
  products: MOCK_PRODUCTS,
  categories: MOCK_CATEGORIES,
  /** compteurs d'ids pour les créations en mémoire */
  seq: { sale: saleSeq, order: 100, user: 1000, audit: auditLog.length + 1, payment: commissionPayments.length + 1, stock: stockMovements.length + 1, address: 10 },
};

export const resellers = () => DB.users.filter((u) => u.role === "revendeur");
export { fullName, userById };

/** Id unique pour un compte créé en mémoire (inscription mock). */
export const nextMockUserId = () => DB.seq.user++;
