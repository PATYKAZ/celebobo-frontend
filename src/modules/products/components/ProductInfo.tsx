"use client";

import { useRouter } from "next/navigation";
import { Bag2, CloseCircle, Heart, Refresh2, ShieldTick, TickCircle, Truck } from "iconsax-reactjs";
import { useEffect, useState } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { Pill } from "@/shared/ui/Badges";
import { Button } from "@/shared/ui/Button";
import { Price } from "@/shared/ui/Price";
import { QuantityStepper } from "@/shared/ui/QuantityStepper";
import { Stars } from "@/shared/ui/Stars";
import { useCart } from "@/modules/cart/hooks/useCart";
import { useFavoriteToggle } from "@/modules/favorites/hooks/useFavorites";
import type { VariantSelection } from "../hooks/useVariantSelection";
import type { Product } from "../types";
import { getPricing } from "../utils";
import { ProductShareMenu } from "./ProductShareMenu";

const TRUST = [
  { icon: Truck, title: "Livraison rapide", text: "24–48 h à Kinshasa" },
  { icon: Refresh2, title: "Retour 30 jours", text: "Satisfait ou remboursé" },
  { icon: ShieldTick, title: "Paiement mobile", text: "Orange, Airtel, M-Pesa" },
];

const SWATCH: Record<string, string> = { Noir: "#111827", Blanc: "#FFFFFF", Argent: "#C7CCD4", Gris: "#6B7280", Bleu: "#3B82F6", Jaune: "#FFD400", Rouge: "#F1352B", Vert: "#1ABA1A", Or: "#D4AF37" };

/** Libellé de stock : « Plus que 3 en stock » sous le seuil d'alerte. */
function stockLabel(stock: number, threshold: number) {
  if (stock <= 0) return "Rupture de stock";
  return stock <= threshold ? `Plus que ${stock} en stock` : "En stock";
}

export function ProductInfo({ product, selection }: { product: Product; selection: VariantSelection }) {
  const router = useRouter();
  const { add } = useCart();
  const { isFavorite, toggle } = useFavoriteToggle();
  const [qty, setQty] = useState(1);
  const base = getPricing(product);
  const fav = isFavorite(product.id);
  const { hasVariants, options, selected, variant, select, isAvailable, stock, inStock, priceDelta } = selection;

  // prix de la variante appliqué au prix normal ET soldé
  const current = base.current + priceDelta;
  const original = base.original != null ? base.original + priceDelta : null;

  // la quantité ne dépasse jamais le stock de la variante choisie
  useEffect(() => {
    if (stock > 0 && qty > stock) setQty(stock);
  }, [stock, qty]);

  const addToCart = (silent?: boolean) =>
    add(product, qty, { silent, variantId: variant?.id ?? null, variantLabel: variant?.label ?? null, priceDelta });

  return (
    <div className="flex min-w-0 flex-col">
      <p className="text-[12px] font-bold uppercase tracking-wider text-primary">{product.category}</p>
      <h1 className="mt-2 text-[24px] leading-[30px] sm:text-[28px] sm:leading-[34px]">{product.name}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Stars rating={product.rating} count={product.reviewsCount} size={15} />
        <a href="#avis" className="text-[13px] text-ink-2 underline-offset-2 hover:text-primary hover:underline">Voir les avis</a>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-y border-line-3 py-5">
        <Price current={current} original={original} size="xl" />
        {base.onSale && <Pill tone="red" className="h-[26px] text-[12px]">-{base.percent}%</Pill>}
        {base.onSale && <span className="text-[13px] font-semibold text-primary">Vous économisez {formatPrice(base.saving)}</span>}
      </div>

      <p className="mt-5 text-[14px] leading-[24px] text-ink-2">{product.description}</p>

      {product.features.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {product.features.slice(0, 5).map((f) => (
            <li key={f} className="flex items-center gap-3 text-[13px] leading-[21.6px]">
              <span className="size-1.5 shrink-0 rounded-full bg-ink-2" /> {f}
            </li>
          ))}
        </ul>
      )}

      {/* Variantes */}
      {hasVariants && (
        <div className="mt-6 space-y-4">
          {options.map((o) => (
            <fieldset key={o.name}>
              <legend className="mb-2 text-[13px] font-bold">
                {o.name} : <span className="font-normal text-ink-2">{selected[o.name]}</span>
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={o.name}>
                {o.values.map((val) => {
                  const active = selected[o.name] === val;
                  const available = isAvailable(o.name, val);
                  const swatch = o.name === "Couleur" ? SWATCH[val] : undefined;
                  return (
                    <button
                      key={val}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={!available && !active}
                      onClick={() => select(o.name, val)}
                      className={cn(
                        "relative flex h-10 items-center gap-2 rounded-md border-2 px-3.5 text-[13px] font-semibold transition-all",
                        active ? "border-primary bg-primary-50 text-primary-dark" : "border-line-3 hover:border-primary/50",
                        !available && "cursor-not-allowed opacity-45 line-through",
                      )}
                    >
                      {swatch && <span className="size-4 rounded-full border border-black/15" style={{ background: swatch }} />}
                      {val}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className={cn("flex items-center gap-1.5 text-[13px] font-semibold", inStock ? (stock <= product.stockThreshold ? "text-[#b87400]" : "text-primary") : "text-danger")}>
          {inStock ? <TickCircle size={16} variant="Bold" /> : <CloseCircle size={16} variant="Bold" />}
          {stockLabel(stock, product.stockThreshold)}
        </span>
        {product.freeShipping ? <Pill tone="green">Livraison offerte</Pill> : product.shippingFee ? <Pill tone="dark">{formatPrice(product.shippingFee)} livraison</Pill> : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, stock)} />
        <Button size="md" disabled={!inStock} onClick={() => addToCart()} leftIcon={<Bag2 size={18} variant="Bold" />} className="flex-1 sm:flex-none">
          Ajouter au panier
        </Button>
        <Button
          variant="dark"
          disabled={!inStock}
          onClick={() => {
            addToCart(true);
            router.push(ROUTES.cart);
          }}
          className="flex-1 sm:flex-none"
        >
          Commander maintenant
        </Button>
        <button
          aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={fav}
          onClick={() => toggle(product.id, product.name)}
          className={cn("grid size-[45px] place-items-center rounded-box bg-chip transition-colors hover:bg-danger-100", fav && "bg-danger-100")}
        >
          <Heart size={20} variant={fav ? "Bold" : "Linear"} color={fav ? "#F1352B" : "currentColor"} />
        </button>
        <ProductShareMenu name={product.name} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {TRUST.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3 rounded-box bg-page/60 p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-primary"><Icon size={20} variant="Bold" /></span>
            <span className="leading-[18px]">
              <span className="block text-[13px] font-bold">{title}</span>
              <span className="text-[12px] text-ink-2">{text}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
