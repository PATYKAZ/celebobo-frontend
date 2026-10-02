import { ENDPOINTS } from "@/config/endpoints";
import { env } from "@/config/env";
import { can } from "@/modules/auth/permissions";
import type { Order } from "@/modules/orders/types";
import { api, ApiError, mockResponse, paginate } from "@/shared/lib/api";
import { channels, realtime, type UserEvent } from "@/shared/lib/realtime";
import { DB, fullName, userById, type DbSale } from "@/shared/mock-db";
import { actorName, getActor, inPeriod, logAudit, nextId, periodDays, productOf, saleCost, saleTotal, totals, visibleSales } from "@/shared/mock-db/selectors";
import type { ConvertibleOrder, ConvertOrderInput, RefundInput, Sale, SaleInput, SaleListParams, SalePage, SalesStats } from "../types";

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

/** yyyy-mm-dd → ISO (heure courante si aujourd'hui, sinon midi). */
const toIso = (d: string) => (d === new Date().toISOString().slice(0, 10) ? new Date().toISOString() : new Date(`${d}T12:00:00`).toISOString());

// ───────────── Mapping DbSale → Sale ─────────────
function toSale(s: DbSale): Sale {
  const p = productOf(s.productId);
  const seller = userById(s.sellerId);
  const buyer = s.buyerId != null ? userById(s.buyerId) : null;
  const total = saleTotal(s);
  const refundBy = s.refund ? userById(s.refund.by) : null;
  return {
    id: s.id,
    productId: s.productId,
    productName: p?.name ?? "Produit supprimé",
    productImage: p?.image ?? null,
    category: p?.category ?? "—",
    seller: seller ? { id: seller.id, name: fullName(seller) } : null,
    buyer: buyer ? { id: buyer.id, name: fullName(buyer) } : null,
    venduA: s.soldTo,
    quantity: s.quantity,
    unitPrice: s.unitPrice,
    total,
    pricePrimary: p?.pricePrimary ?? null,
    profit: total - saleCost(s),
    dateAchat: s.soldAt,
    dateEnregistrement: s.recordedAt,
    method: s.method,
    status: s.status,
    refund: s.refund ? { amount: s.refund.amount, reason: s.refund.reason, at: s.refund.at, by: refundBy ? fullName(refundBy) : "—" } : null,
    orderId: s.orderId,
  };
}

// ───────────── Filtrage (rôle + filtres) ─────────────
function filtered(params: SaleListParams): { rows: DbSale[]; label: string } {
  const actor = getActor();
  let rows = [...visibleSales(actor)];
  // ventes_rev (v1) : réservé aux responsables — ventes réalisées par les revendeurs
  if (params.view === "revendeur" && can(actor, "sales.view.all")) {
    rows = rows.filter((s) => userById(s.sellerId)?.role === "revendeur");
  }
  if (params.sellerId && can(actor, "sales.view.all")) rows = rows.filter((s) => s.sellerId === params.sellerId);
  if (params.method) rows = rows.filter((s) => s.method === params.method);
  if (params.status) rows = rows.filter((s) => s.status === params.status);
  if (params.productId) rows = rows.filter((s) => s.productId === params.productId);

  let label = "Toute la période";
  if (params.preset) {
    const p = periodDays(Number(params.preset));
    rows = rows.filter((s) => inPeriod(s, p));
    label = p.label;
  } else if (params.dateFrom || params.dateTo) {
    const from = params.dateFrom ? new Date(`${params.dateFrom}T00:00:00`) : null;
    const to = params.dateTo ? new Date(`${params.dateTo}T23:59:59`) : null;
    rows = rows.filter((s) => {
      const t = +new Date(s.soldAt);
      return (!from || t >= +from) && (!to || t <= +to);
    });
    label = `${from ? dateFmt.format(from) : "…"} → ${to ? dateFmt.format(to) : "…"}`;
  }
  if (params.recordedOn) {
    rows = rows.filter((s) => s.recordedAt.slice(0, 10) === params.recordedOn);
    label += ` · enregistrées le ${dateFmt.format(new Date(`${params.recordedOn}T12:00:00`))}`;
  }
  if (params.search) {
    const q = params.search.toLowerCase().replace(/^#/, "");
    rows = rows.filter((s) => {
      const p = productOf(s.productId);
      const seller = userById(s.sellerId);
      return `${s.id} ${p?.name ?? ""} ${s.soldTo ?? ""} ${seller ? fullName(seller) : ""}`.toLowerCase().includes(q);
    });
  }
  rows.sort((a, b) => +new Date(b.soldAt) - +new Date(a.soldAt));
  return { rows, label };
}

const statsOf = (rows: DbSale[]): SalesStats => {
  const t = totals(rows);
  return { revenue: t.revenue, profit: t.profit, count: t.count, units: t.units, average: t.average };
};

// ───────────── Stock ─────────────
function adjustStock(productId: number, delta: number, reason: "vente" | "retour" | "correction", note: string) {
  const p = productOf(productId);
  if (!p) return;
  const a = getActor();
  p.stock = Math.max(0, p.stock + delta);
  p.inStock = p.stock > 0;
  DB.stockMovements.unshift({ id: nextId("stock"), productId, at: new Date().toISOString(), delta, reason, by: { id: a.id, name: actorName(a) }, note, balanceAfter: p.stock });
}

function assertCan(perm: Parameters<typeof can>[1], message: string) {
  if (!can(getActor(), perm)) throw new ApiError(403, message);
}

function findSale(id: number): DbSale {
  const s = DB.sales.find((x) => x.id === id);
  if (!s) throw new ApiError(404, "Vente introuvable");
  // un revendeur ne voit/modifie que SES ventes
  if (!can(getActor(), "sales.view.all") && s.sellerId !== getActor().id) throw new ApiError(404, "Vente introuvable");
  return s;
}

function validate(input: SaleInput) {
  const p = productOf(input.productId);
  if (!p) throw new ApiError(400, "Produit introuvable", { productId: ["Produit introuvable."] });
  if (!(input.quantity >= 1)) throw new ApiError(400, "Quantité invalide", { quantity: ["Au moins 1."] });
  if (!(input.unitPrice >= 0)) throw new ApiError(400, "Prix invalide", { unitPrice: ["Prix invalide."] });
  if (!input.soldAt) throw new ApiError(400, "Date requise", { soldAt: ["Date requise."] });
  return p;
}

function insertSale(input: SaleInput, extra: Partial<DbSale> = {}): DbSale {
  const a = getActor();
  const now = new Date().toISOString();
  const sale: DbSale = {
    id: nextId("sale"),
    productId: input.productId,
    sellerId: a.id,
    buyerId: null,
    soldTo: input.venduA?.trim() || null,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    method: input.method,
    soldAt: toIso(input.soldAt),
    recordedAt: now,
    orderId: null,
    status: "valide",
    refund: null,
    ...extra,
  };
  DB.sales.unshift(sale);
  return sale;
}

// ───────────── Conversion commande → ventes ─────────────
function convertedAtOf(o: Order): string | null {
  if (!o.convertedToSales) return null;
  const s = DB.sales.find((x) => x.orderId === o.id);
  return s?.recordedAt ?? o.statusHistory.find((h) => h.note?.includes("Convertie"))?.at ?? o.statusHistory.at(-1)?.at ?? o.createdAt;
}

function describe(o: Order): ConvertibleOrder {
  const convertedAt = convertedAtOf(o);
  let blockedReason: string | null = null;
  if (o.convertedToSales) blockedReason = `Déjà convertie le ${dateFmt.format(new Date(convertedAt ?? o.createdAt))}`;
  else if (o.status === "annulee") blockedReason = "Commande annulée";
  else if (o.status === "retournee") blockedReason = "Commande retournée";
  return { order: o, convertible: !blockedReason, blockedReason, convertedAt };
}

const visibleOrders = (): Order[] => {
  const a = getActor();
  return can(a, "orders.view.all") ? DB.orders : DB.orders.filter((o) => o.assignedRevendeur?.id === a.id);
};

export function salesCsv(rows: Sale[]): string {
  const esc = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["N°", "Date vente", "Enregistrée le", "Produit", "Quantité", "Prix unitaire", "Total", "Bénéfice", "Moyen de paiement", "Vendu à", "Vendeur", "Commande", "Statut"];
  const lines = rows.map((s) => [s.id, s.dateAchat.slice(0, 10), s.dateEnregistrement.slice(0, 10), s.productName, s.quantity, s.unitPrice, s.total, s.profit, s.method, s.venduA, s.seller?.name, s.orderId ?? "", s.status].map(esc).join(";"));
  return "﻿" + [head.map(esc).join(";"), ...lines].join("\n");
}

export const salesService = {
  list(params: SaleListParams = {}): Promise<SalePage> {
    if (env.USE_MOCKS) {
      return mockResponse(() => {
        const { rows, label } = filtered(params);
        const page = paginate(rows.map(toSale), params.page ?? 1, params.pageSize ?? 10);
        return { ...page, stats: statsOf(rows), periodLabel: label };
      }, 300);
    }
    return api.get<SalePage>(ENDPOINTS.admin.sales.list, { params: params as never });
  },

  /** Toutes les lignes filtrées (export CSV côté client en mock). */
  async listAll(params: SaleListParams = {}): Promise<Sale[]> {
    if (env.USE_MOCKS) return mockResponse(() => filtered(params).rows.map(toSale), 200);
    const res = await api.get<SalePage>(ENDPOINTS.admin.sales.list, { params: { ...params, page: 1, pageSize: 10000 } as never });
    return res.results;
  },

  /** Vendeurs ayant des ventes visibles (filtre responsable). */
  async sellers(): Promise<{ id: number; name: string }[]> {
    if (env.USE_MOCKS) {
      return mockResponse(() => {
        const ids = [...new Set(DB.sales.map((s) => s.sellerId))];
        return ids.map((id) => userById(id)).filter(Boolean).map((u) => ({ id: u!.id, name: fullName(u!) })).sort((a, b) => a.name.localeCompare(b.name));
      }, 100);
    }
    return api.get(ENDPOINTS.admin.resellers.list, { params: { pageSize: 100 } });
  },

  async detail(id: number): Promise<Sale> {
    if (env.USE_MOCKS) return mockResponse(() => toSale(findSale(id)), 200);
    return api.get<Sale>(ENDPOINTS.admin.sales.detail(id));
  },

  async create(input: SaleInput): Promise<Sale> {
    if (env.USE_MOCKS) {
      assertCan("sales.create", "Vous ne pouvez pas enregistrer de vente.");
      const p = validate(input);
      if (input.quantity > p.stock) throw new ApiError(400, "Stock insuffisant", { quantity: [`Stock insuffisant (${p.stock} disponible${p.stock > 1 ? "s" : ""}).`] });
      const sale = insertSale(input);
      adjustStock(p.id, -input.quantity, "vente", `Vente #${sale.id}`);
      logAudit({ action: "Vente enregistrée", entity: "vente", entityId: sale.id, summary: `${p.name} × ${input.quantity} — $${(input.unitPrice * input.quantity).toFixed(2)}` });
      return mockResponse(toSale(sale), 450);
    }
    return api.post<Sale>(ENDPOINTS.admin.sales.create, input);
  },

  /** Ventes multiples (lignes libres) : date / méthode communes, client par ligne. */
  async createMany(inputs: SaleInput[]): Promise<Sale[]> {
    if (env.USE_MOCKS) {
      assertCan("sales.create", "Vous ne pouvez pas enregistrer de vente.");
      if (!inputs.length) throw new ApiError(400, "Ajoutez au moins une ligne.");
      // validation globale d'abord (tout ou rien) + cumul des quantités par produit
      const need = new Map<number, number>();
      inputs.forEach((i) => {
        const p = validate(i);
        need.set(p.id, (need.get(p.id) ?? 0) + i.quantity);
      });
      for (const [pid, q] of need) {
        const p = productOf(pid)!;
        if (q > p.stock) throw new ApiError(400, "Stock insuffisant", { lines: [`${p.name} : stock insuffisant (${p.stock} disponible${p.stock > 1 ? "s" : ""}, ${q} demandés).`] });
      }
      const created = inputs.map((i) => {
        const s = insertSale(i);
        adjustStock(i.productId, -i.quantity, "vente", `Vente #${s.id}`);
        return s;
      });
      logAudit({ action: "Ventes multiples enregistrées", entity: "vente", entityId: created[0]?.id ?? null, summary: `${created.length} vente(s) pour $${created.reduce((n, s) => n + saleTotal(s), 0).toFixed(2)}` });
      return mockResponse(created.map(toSale), 550);
    }
    return api.post<Sale[]>(ENDPOINTS.admin.sales.bulk, { sales: inputs });
  },

  async update(id: number, input: SaleInput): Promise<Sale> {
    if (env.USE_MOCKS) {
      const a = getActor();
      const s = findSale(id);
      const own = s.sellerId === a.id;
      if (!(can(a, "sales.edit.all") || (can(a, "sales.edit.own") && own))) throw new ApiError(403, "Vous ne pouvez modifier que vos propres ventes.");
      if (s.status !== "valide") throw new ApiError(400, "Une vente remboursée ou retournée ne peut plus être modifiée.");
      const p = validate(input);
      // stock : rend l'ancien, retire le nouveau
      const avail = p.stock + (s.productId === p.id ? s.quantity : 0);
      if (input.quantity > avail) throw new ApiError(400, "Stock insuffisant", { quantity: [`Stock insuffisant (${avail} disponible${avail > 1 ? "s" : ""}).`] });
      const before = { price: s.unitPrice, qty: s.quantity };
      if (s.productId !== p.id || s.quantity !== input.quantity) {
        adjustStock(s.productId, s.quantity, "correction", `Modification de la vente #${s.id}`);
        adjustStock(p.id, -input.quantity, "vente", `Modification de la vente #${s.id}`);
      }
      Object.assign(s, { productId: p.id, quantity: input.quantity, unitPrice: input.unitPrice, method: input.method, soldAt: toIso(input.soldAt), soldTo: input.venduA?.trim() || null });
      const diff = [
        ...(before.price !== s.unitPrice ? [{ field: "prix unitaire", from: before.price, to: s.unitPrice }] : []),
        ...(before.qty !== s.quantity ? [{ field: "quantité", from: before.qty, to: s.quantity }] : []),
      ];
      logAudit({ action: "Vente modifiée", entity: "vente", entityId: s.id, summary: `Vente #${s.id} (${p.name})`, diff });
      return mockResponse(toSale(s), 450);
    }
    return api.patch<Sale>(ENDPOINTS.admin.sales.update(id), input);
  },

  async remove(id: number): Promise<void> {
    if (env.USE_MOCKS) {
      assertCan("sales.delete", "Seul un administrateur peut supprimer une vente.");
      const s = findSale(id);
      if (s.status === "valide") adjustStock(s.productId, s.quantity, "correction", `Suppression de la vente #${s.id}`);
      DB.sales.splice(DB.sales.indexOf(s), 1);
      logAudit({ action: "Vente supprimée", entity: "vente", entityId: id, summary: `Vente #${id} supprimée (${productOf(s.productId)?.name ?? "produit"})` });
      return mockResponse(undefined, 350);
    }
    await api.delete(ENDPOINTS.admin.sales.remove(id));
  },

  /** Remboursement (montant) ou retour (remise en stock). */
  async refund(id: number, input: RefundInput): Promise<Sale> {
    if (env.USE_MOCKS) {
      assertCan("sales.refund", "Seul un responsable peut rembourser une vente.");
      const s = findSale(id);
      const total = saleTotal(s);
      if (s.status !== "valide") throw new ApiError(400, "Cette vente a déjà été remboursée ou retournée.");
      if (!(input.amount > 0) || input.amount > total) throw new ApiError(400, "Montant invalide", { amount: [`Entre $0.01 et $${total.toFixed(2)}.`] });
      if (!input.reason.trim()) throw new ApiError(400, "Motif requis", { reason: ["Indiquez le motif."] });
      const a = getActor();
      s.status = input.type === "retour" ? "retournée" : "remboursée";
      s.refund = { amount: input.amount, reason: input.reason.trim(), at: new Date().toISOString(), by: a.id };
      if (input.type === "retour") adjustStock(s.productId, s.quantity, "retour", `Retour de la vente #${s.id}`);
      logAudit({ action: input.type === "retour" ? "Vente retournée" : "Vente remboursée", entity: "vente", entityId: s.id, summary: `Vente #${s.id} : ${input.type} de $${input.amount.toFixed(2)} — ${input.reason.trim()}` });
      return mockResponse(toSale(s), 450);
    }
    return api.post<Sale>(ENDPOINTS.admin.salesActions.refund(id), input);
  },

  /** v1 `search_orders_by_user` : par n° de commande, nom ou e-mail du client. Sans requête : commandes récentes convertibles. */
  async searchOrders(q: string): Promise<ConvertibleOrder[]> {
    if (env.USE_MOCKS) {
      return mockResponse(() => {
        const query = q.trim().toLowerCase().replace(/^#/, "");
        let list = visibleOrders();
        list = query
          ? list.filter((o) => `${o.id} ${o.user.name} ${o.user.email ?? ""}`.toLowerCase().includes(query))
          : list.filter((o) => !o.convertedToSales && o.status !== "annulee" && o.status !== "retournee");
        return [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, query ? 20 : 8).map(describe);
      }, 250);
    }
    return api.get<ConvertibleOrder[]>(ENDPOINTS.admin.sales.searchOrders, { params: { q } });
  },

  async convertible(orderId: number): Promise<ConvertibleOrder> {
    if (env.USE_MOCKS) {
      return mockResponse(() => {
        const o = visibleOrders().find((x) => x.id === orderId);
        if (!o) throw new ApiError(404, "Commande introuvable");
        return describe(o);
      }, 200);
    }
    return api.get<ConvertibleOrder>(ENDPOINTS.admin.sales.searchOrders, { params: { orderId } });
  },

  /** Convertit une commande en ventes : 1 vente par ligne (quantité conservée), commande → livrée. 409 si déjà convertie. */
  async convertOrder(orderId: number, input: ConvertOrderInput): Promise<{ sales: Sale[]; order: Order }> {
    if (env.USE_MOCKS) {
      const a = getActor();
      assertCan("sales.convert", "Vous ne pouvez pas convertir de commande.");
      const o = visibleOrders().find((x) => x.id === orderId);
      if (!o) throw new ApiError(404, "Commande introuvable");
      if (o.convertedToSales) throw new ApiError(409, `La commande #${o.id} a déjà été convertie en ventes.`);
      if (o.status === "annulee" || o.status === "retournee") throw new ApiError(409, `La commande #${o.id} est ${o.status === "annulee" ? "annulée" : "retournée"} : conversion impossible.`);
      const created: DbSale[] = [];
      for (const it of o.items) {
        if (it.productId == null) continue;
        const price = input.lines.find((l) => l.itemId === it.id)?.unitPrice ?? it.unitPrice;
        const s = insertSale(
          { productId: it.productId, quantity: it.quantity, unitPrice: price, method: input.method, soldAt: input.soldAt, venduA: input.venduA || o.user.name },
          { buyerId: o.user.id, orderId: o.id },
        );
        adjustStock(it.productId, -it.quantity, "vente", `Commande #${o.id}`);
        created.push(s);
      }
      o.convertedToSales = true;
      o.status = "livree";
      o.statusHistory.push({ status: "livree", at: new Date().toISOString(), by: { id: a.id, name: actorName(a), role: a.role }, note: "Convertie en ventes" });
      const ev: UserEvent = { type: "order.status", orderId: o.id, status: o.status };
      realtime.emit(channels.user(o.user.id), ev);
      if (o.assignedRevendeur) realtime.emit(channels.user(o.assignedRevendeur.id), ev);
      logAudit({ action: "Commande convertie en ventes", entity: "commande", entityId: o.id, summary: `Commande #${o.id} → ${created.length} vente(s), $${created.reduce((n, s) => n + saleTotal(s), 0).toFixed(2)}` });
      return mockResponse({ sales: created.map(toSale), order: o }, 650);
    }
    return api.post(ENDPOINTS.admin.salesActions.convertOrder(orderId), input);
  },

  /** Export Excel / PDF (liens réels côté API). */
  exportUrl(kind: "excel" | "pdf", params: SaleListParams): string {
    return api.url(kind === "excel" ? ENDPOINTS.admin.sales.exportExcel : ENDPOINTS.admin.sales.exportPdf, params as never);
  },
};

