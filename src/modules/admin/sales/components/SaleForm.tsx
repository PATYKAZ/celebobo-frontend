"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ROUTES } from "@/config/routes";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { formatPrice, formatDate } from "@/shared/lib/format";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Input, Select } from "@/shared/ui/Form";
import { toast } from "@/shared/ui/Toast";
import { cn } from "@/shared/lib/cn";
import { PAYMENT_METHODS, type PaymentMethod } from "@/modules/orders/types";
import type { Product } from "@/modules/products/types";
import { getPricing } from "@/modules/products/utils";
import { useAdminProduct } from "../../products/hooks/useAdminProducts";
import { useOrderSearch, useSaveSale } from "../hooks/useSales";
import type { Sale } from "../types";
import { ProductCombobox } from "./ProductCombobox";

/** Formulaire d'une vente unique (création / édition). */
export function SaleForm({ sale }: { sale?: Sale }) {
  const router = useRouter();
  const save = useSaveSale(sale?.id ?? null);
  const { data: initialProduct } = useAdminProduct(sale?.productId);

  const [product, setProduct] = useState<Product | null>(null);
  const [price, setPrice] = useState(sale ? String(sale.priceFinal) : "");
  const [method, setMethod] = useState<PaymentMethod>(sale?.method ?? "Cash");
  const [venduA, setVenduA] = useState(sale?.venduA ?? "");
  const [orderId, setOrderId] = useState<number | null>(sale?.orderId ?? null);
  const [orderQ, setOrderQ] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dq = useDebounce(orderQ, 250);
  const { data: orders } = useOrderSearch(dq);

  useEffect(() => {
    if (initialProduct && !product) setProduct(initialProduct);
  }, [initialProduct, product]);

  const pick = (p: Product) => {
    setProduct(p);
    setErrors((e) => ({ ...e, productId: "" }));
    setPrice(String(getPricing(p).current)); // prix suggéré
  };

  const cost = product?.pricePrimary ?? null;
  const profit = cost != null && price ? Number(price) - cost : null;

  const submit = () => {
    const e: Record<string, string> = {};
    if (!product) e.productId = "Choisissez un produit.";
    if (!price || Number(price) <= 0) e.priceFinal = "Prix final invalide.";
    setErrors(e);
    if (Object.keys(e).length || !product) return;
    save.mutate(
      { productId: product.id, priceFinal: Number(price), method, venduA, orderId },
      {
        onSuccess: () => {
          toast.success(sale ? "Vente mise à jour" : "Vente enregistrée", product.name);
          router.push(ROUTES.admin.sales);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 400) {
            const fe: Record<string, string> = {};
            for (const [k, m] of Object.entries(err.fieldErrors)) fe[k] = Array.isArray(m) ? m[0] : String(m);
            setErrors(fe);
          }
          toast.error("Enregistrement impossible", getErrorMessage(err));
        },
      },
    );
  };

  return (
    <Block className="grid gap-5">
      <ProductCombobox label="Produit" value={product} onChange={pick} error={errors.productId} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Prix final ($)" required type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} error={errors.priceFinal} hint={product ? `Prix catalogue : ${formatPrice(getPricing(product).current)}` : undefined} />
        <Select label="Moyen de paiement" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))} />
      </div>
      {profit != null && (
        <div className="flex items-center justify-between rounded-box bg-page/60 px-4 py-3 text-[14px]">
          <span className="text-ink-2">Bénéfice estimé</span>
          <span className={cn("font-bold", profit < 0 ? "text-danger" : "text-primary-dark")}>{formatPrice(profit)}</span>
        </div>
      )}
      <Input label="Vendu à" value={venduA} onChange={(e) => setVenduA(e.target.value)} placeholder="Nom du client" />

      <div>
        <Input label="Lier à une commande client (optionnel)" value={orderQ} onChange={(e) => setOrderQ(e.target.value)} placeholder="Nom, e-mail ou n° de commande…" />
        {orderId && <p className="mt-2 text-[13px]">Commande liée : <strong className="text-primary">#{orderId}</strong> <button type="button" onClick={() => setOrderId(null)} className="ml-2 text-danger underline">retirer</button></p>}
        {orders && orders.length > 0 && orderQ && (
          <ul className="mt-2 grid gap-1.5">
            {orders.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOrderId(o.id);
                    if (!venduA) setVenduA(o.user.name);
                    setOrderQ("");
                  }}
                  className="flex w-full items-center justify-between rounded-md border border-line-3 px-3 py-2 text-left text-[13px] transition-colors hover:border-primary hover:bg-primary-50"
                >
                  <span><strong>#{o.id}</strong> · {o.user.name} · {formatDate(o.createdAt)}</span>
                  <span className="font-semibold">{formatPrice(o.totalPrice)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-line-3 pt-5">
        <Button variant="chip" upper={false} onClick={() => router.push(ROUTES.admin.sales)}>Annuler</Button>
        <Button upper={false} loading={save.isPending} onClick={submit}>{sale ? "Enregistrer" : "Enregistrer la vente"}</Button>
      </div>
    </Block>
  );
}
