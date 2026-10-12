"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { formatPrice } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import { Input, Select, Switch } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { toast } from "@/shared/ui/Toast";
import type { Product } from "@/modules/products/types";
import { getPricing } from "@/modules/products/utils";
import { useAdminProduct } from "../../products/hooks/useAdminProducts";
import { ProductCombobox } from "../../sales/components/ProductCombobox";
import { useSaveDeal } from "../hooks/useAdminDeals";
import { dealToForm, emptyDeal } from "../services/admin-deals.service";
import type { AdminDeal, DealFormValues } from "../types";

type Errors = Partial<Record<keyof DealFormValues, string>>;

const price = (s: string) => Number(s.replace(",", "."));

function validate(v: DealFormValues, hasVariants: boolean, regular: number | null): Errors {
  const e: Errors = {};
  if (!v.productId) e.productId = "Choisissez un produit.";
  if (hasVariants && !v.variantId) e.variantId = "Choisissez la variante en offre.";
  if (!v.dealPrice.trim() || !(price(v.dealPrice) > 0)) e.dealPrice = "Indiquez le prix de l'offre.";
  else if (regular != null && price(v.dealPrice) >= regular) e.dealPrice = `Le prix de l'offre doit être inférieur au prix normal (${formatPrice(regular)}).`;
  if (!v.startsAt) e.startsAt = "Indiquez le début.";
  if (!v.endsAt) e.endsAt = "Indiquez la fin.";
  else if (v.startsAt && v.endsAt <= v.startsAt) e.endsAt = "La fin doit suivre le début.";
  if (v.quantity.trim() && !(Number.isInteger(Number(v.quantity)) && Number(v.quantity) > 0)) e.quantity = "Nombre entier, au moins 1.";
  return e;
}

/** Création / modification d'une offre du jour. Monté seulement quand il est ouvert (`key` du parent). */
export function DealFormModal({ deal, onClose }: { deal: AdminDeal | null; onClose: () => void }) {
  const [v, setV] = useState<DealFormValues>(() => (deal ? dealToForm(deal) : emptyDeal()));
  const [picked, setPicked] = useState<Product | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  // variantes et prix normal du produit choisi
  const { data: product, isLoading: loadingProduct } = useAdminProduct(v.productId ?? undefined);
  const save = useSaveDeal(deal);
  const variants = product?.variants ?? [];
  const variant = variants.find((x) => x.id === v.variantId) ?? null;
  // prix payé sans l'offre : celui de la variante, à défaut celui du produit (promotion comprise) ; en modification, celui de l'API
  const regular = deal && v.variantId === deal.variantId ? deal.regularPrice : product ? (variant?.price ?? getPricing(product).current) : null;
  const percent = regular && price(v.dealPrice) > 0 && price(v.dealPrice) < regular ? Math.round((1 - price(v.dealPrice) / regular) * 100) : null;

  const set = <K extends keyof DealFormValues>(k: K, value: DealFormValues[K]) => {
    setV((x) => ({ ...x, [k]: value }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(v, variants.length > 0, regular);
    setErrors(found);
    if (Object.keys(found).length) return;
    save.mutate(v, {
      onSuccess: () => {
        toast.success(deal ? "Offre mise à jour" : "Offre programmée", product?.name ?? deal?.product.name);
        onClose();
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 400) {
          const next: Errors = {};
          for (const [k, msg] of Object.entries(err.fieldErrors)) next[k as keyof Errors] = Array.isArray(msg) ? String(msg[0]) : String(msg);
          setErrors(next);
        }
        toast.error("Enregistrement impossible", getErrorMessage(err));
      },
    });
  };

  const shown = picked ?? product ?? null;

  return (
    <Modal open onClose={onClose} title={deal ? "Modifier l'offre" : "Nouvelle offre du jour"} className="max-w-[600px]">
      <form onSubmit={submit} noValidate className="grid gap-4">
        {deal ? (
          <div className="flex items-center gap-3 rounded-box border border-line-3 p-3">
            <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-page">{deal.product.image && <Image src={deal.product.image} alt="" fill sizes="48px" className="object-cover" />}</span>
            <p className="min-w-0 text-[14px] font-bold leading-[18px]">{deal.product.name}</p>
          </div>
        ) : (
          <ProductCombobox
            label="Produit"
            value={shown}
            onChange={(p) => {
              setPicked(p);
              setV((x) => ({ ...x, productId: p.id, variantId: null }));
              setErrors((e) => ({ ...e, productId: undefined, variantId: undefined, dealPrice: undefined }));
            }}
            error={errors.productId}
          />
        )}

        {variants.length > 0 && (
          <Select
            label="Variante en offre"
            required
            value={v.variantId ?? ""}
            onChange={(e) => set("variantId", e.target.value ? Number(e.target.value) : null)}
            error={errors.variantId}
            hint="L'offre ne s'applique qu'à cette variante."
            options={[{ value: "", label: "Choisir une variante…" }, ...variants.map((x) => ({ value: x.id, label: `${x.label} · ${formatPrice(x.price ?? (product ? getPricing(product).current : 0))} · stock ${x.stock}` }))]}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Prix de l'offre ($)"
            required
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={v.dealPrice}
            onChange={(e) => set("dealPrice", e.target.value)}
            hint={loadingProduct ? "Chargement du prix normal…" : regular != null ? `Prix normal : ${formatPrice(regular)}${percent ? ` · −${percent} %` : ""}` : undefined}
            error={errors.dealPrice}
          />
          <Input label="Quantité en offre" type="number" inputMode="numeric" min="1" step="1" value={v.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="Sans limite" hint="Au-delà, prix normal. Vide : sans limite." error={errors.quantity} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Début" required type="datetime-local" value={v.startsAt} onChange={(e) => set("startsAt", e.target.value)} error={errors.startsAt} />
          <Input label="Fin" required type="datetime-local" value={v.endsAt} onChange={(e) => set("endsAt", e.target.value)} hint="Le compte à rebours de l'accueil s'arrête ici." error={errors.endsAt} />
        </div>

        <Input label="Cadeau offert" value={v.giftLabel} onChange={(e) => set("giftLabel", e.target.value)} maxLength={80} placeholder="Ex. Coque offerte (vide : aucun cadeau)" error={errors.giftLabel} />

        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-box border border-line px-4 active:bg-chip">
          <span className="text-[14px] font-semibold">Offre active</span>
          <Switch label="Offre active" checked={v.isActive} onChange={(x) => set("isActive", x)} />
        </label>
        <p className="-mt-2 text-[12px] leading-[17px] text-ink-3">
          Pendant l’offre, le prix s’applique partout : accueil, fiche produit, panier et commande. Si plusieurs offres sont en cours, l’accueil montre celle qui se termine en premier.
        </p>

        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="chip" upper={false} onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={save.isPending} upper={false}>{deal ? "Enregistrer" : "Programmer l'offre"}</Button>
        </div>
      </form>
    </Modal>
  );
}
