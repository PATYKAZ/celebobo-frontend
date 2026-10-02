"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ROUTES } from "@/config/routes";
import { formatPrice } from "@/shared/lib/format";
import { getErrorMessage } from "@/shared/lib/api";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { FormField, Input, Select } from "@/shared/ui/Form";
import { QuantityStepper } from "@/shared/ui/QuantityStepper";
import { toast } from "@/shared/ui/Toast";
import { useProduct } from "@/modules/products/hooks/useProducts";
import type { Product } from "@/modules/products/types";
import { getPricing } from "@/modules/products/utils";
import { useSaveSale } from "../hooks/useSales";
import { METHOD_STYLE, type PaymentMethod, type Sale } from "../types";
import { fieldErrorsOf, todayStr, toDateInput } from "../utils";
import { ProductCombobox } from "./ProductCombobox";

const METHOD_OPTIONS = (Object.keys(METHOD_STYLE) as PaymentMethod[]).map((m) => ({ value: m, label: METHOD_STYLE[m].label }));

/** Vente unique : création ou modification (date de la vente, quantité, prix final, moyen de paiement, « vendu à »). */
export function SaleForm({ sale }: { sale?: Sale }) {
  const router = useRouter();
  const save = useSaveSale(sale?.id ?? null);
  const { data: existing } = useProduct(sale?.productId);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(sale?.quantity ?? 1);
  const [price, setPrice] = useState(sale ? String(sale.unitPrice) : "");
  const [method, setMethod] = useState<PaymentMethod>(sale?.method ?? "Cash");
  const [soldAt, setSoldAt] = useState(sale ? toDateInput(sale.dateAchat) : todayStr());
  const [venduA, setVenduA] = useState(sale?.venduA ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existing && !product) setProduct(existing);
  }, [existing, product]);

  const pick = (p: Product) => {
    setProduct(p);
    setPrice(String(getPricing(p).current));
    setErrors((e) => ({ ...e, productId: "" }));
  };

  const unit = Number(price) || 0;
  const total = unit * quantity;
  const cost = product?.pricePrimary != null ? product.pricePrimary * quantity : null;
  const available = product ? product.stock + (sale && sale.productId === product.id ? sale.quantity : 0) : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!product) err.productId = "Choisissez un produit.";
    if (price === "" || !(unit >= 0)) err.unitPrice = "Prix final requis.";
    if (!soldAt) err.soldAt = "Date requise.";
    if (available != null && quantity > available) err.quantity = `Stock insuffisant (${available} disponible${available > 1 ? "s" : ""}).`;
    setErrors(err);
    if (Object.keys(err).length || !product) return;
    save.mutate(
      { productId: product.id, quantity, unitPrice: unit, method, soldAt, venduA },
      {
        onSuccess: () => {
          toast.success(sale ? "Vente modifiée" : "Vente enregistrée", `${product.name} × ${quantity}`);
          router.push(ROUTES.admin.sales);
        },
        onError: (er) => {
          setErrors(fieldErrorsOf(er));
          toast.error("Enregistrement impossible", getErrorMessage(er));
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Block pad="none" className="min-w-0 space-y-4 p-4 sm:space-y-5 sm:p-[30px]">
        <ProductCombobox value={product} onChange={pick} error={errors.productId} label="Produit" />
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <FormField label="Quantité" required error={errors.quantity} hint={available != null ? `Stock disponible : ${available}` : undefined}>
            <QuantityStepper value={quantity} onChange={setQuantity} max={999} />
          </FormField>
          <Input label="Prix final unitaire ($)" required type="number" inputMode="decimal" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} error={errors.unitPrice} hint={product ? `Prix catalogue : ${formatPrice(getPricing(product).current)}` : undefined} />
          <Input label="Date de la vente" required type="date" max={todayStr()} value={soldAt} onChange={(e) => setSoldAt(e.target.value)} error={errors.soldAt} />
          <Select label="Moyen de paiement" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} options={METHOD_OPTIONS} />
        </div>
        <Input label="Vendu à" value={venduA} onChange={(e) => setVenduA(e.target.value)} maxLength={50} placeholder="Nom du client (facultatif)" />
      </Block>

      <Block pad="none" className="h-fit min-w-0 space-y-4 p-4 sm:p-[30px] xl:sticky xl:top-4">
        <h3 className="text-[16px]">Récapitulatif</h3>
        <dl className="space-y-2.5 text-[14px]">
          <div className="flex justify-between"><dt className="text-ink-2">Prix unitaire</dt><dd className="font-semibold">{formatPrice(unit)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-2">Quantité</dt><dd className="font-semibold">× {quantity}</dd></div>
          <div className="flex justify-between border-t border-line-3 pt-3 text-[16px]"><dt className="font-bold">Total</dt><dd className="font-bold text-primary">{formatPrice(total)}</dd></div>
          {cost != null && (
            <div className="flex justify-between"><dt className="text-ink-2">Bénéfice estimé</dt><dd className={`font-semibold ${total - cost < 0 ? "text-danger" : "text-primary-dark"}`}>{formatPrice(total - cost)}</dd></div>
          )}
        </dl>
        <div className="hidden gap-2 pt-2 xl:flex">
          <Button variant="chip" upper={false} href={ROUTES.admin.sales} className="flex-1">Annuler</Button>
          <Button type="submit" loading={save.isPending} upper={false} className="flex-1">{sale ? "Enregistrer" : "Valider la vente"}</Button>
        </div>
      </Block>

      {/* < xl : barre d'actions fixe au-dessus de la barre d'onglets, avec le total */}
      <div className="h-20 xl:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-[max(var(--tabbar-h),env(safe-area-inset-bottom))] z-40 flex items-center gap-3 border-t border-line-3 bg-white/95 px-4 py-3 backdrop-blur-xl xl:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Total</p>
          <p className="truncate text-[20px] font-bold leading-[24px] text-primary">{formatPrice(total)}</p>
        </div>
        <Button variant="chip" upper={false} href={ROUTES.admin.sales}>Annuler</Button>
        <Button type="submit" loading={save.isPending} upper={false} className="min-w-[132px]">{sale ? "Enregistrer" : "Valider"}</Button>
      </div>
    </form>
  );
}
