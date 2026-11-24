"use client";


import { Bag2, CloseCircle, Heart, Refresh2, ShieldTick, TickCircle, Truck } from "@/shared/ui/icons";
import { useEffect } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { useFormatPrice } from "@/shared/currency/CurrencyProvider";
import { Pill } from "@/shared/ui/Badges";
import { Button } from "@/shared/ui/Button";
import { Price } from "@/shared/ui/Price";
import { QuantityStepper } from "@/shared/ui/QuantityStepper";
import { Stars } from "@/shared/ui/Stars";
import { useCart } from "@/modules/cart/hooks/useCart";
import { useFavoriteToggle } from "@/modules/favorites/hooks/useFavorites";
import { returnPeriod, useSiteSettings } from "@/modules/site";
import type { VariantSelection } from "../hooks/useVariantSelection";
import type { Product } from "../types";
import { getPricing } from "../utils";
import { ProductShareMenu } from "./ProductShareMenu";
import { useAppRouter } from "@/shared/hooks/useAppRouter";

/** Engagements de la boutique ; le délai de retour vient des réglages du site. */
const trustItems = (returnDays: number) => [
  { icon: Truck, title: "Livraison rapide", text: "Bukavu, Goma et environs" },
  ...(returnDays > 0 ? [{ icon: Refresh2, title: `Retour ${returnPeriod(returnDays)}`, text: "Produit non utilisé, après livraison" }] : []),
  { icon: ShieldTick, title: "Paiement mobile", text: "Orange, Airtel, M-Pesa" },
];

const SWATCH: Record<string, string> = { Noir: "#111827", Blanc: "#FFFFFF", Argent: "#C7CCD4", Gris: "#6B7280", Bleu: "#3B82F6", Jaune: "#FFD400", Rouge: "#F1352B", Vert: "#16A34A", Or: "#D4AF37" };

/** Libellé de stock : « Plus que 3 en stock » sous le seuil d'alerte. */
function stockLabel(stock: number, threshold: number) {
  if (stock <= 0) return "Rupture de stock";
  return stock <= threshold ? `Plus que ${stock} en stock` : "En stock";
}

export function ProductInfo({ product, selection, qty, onQtyChange }: { product: Product; selection: VariantSelection; qty: number; onQtyChange: (n: number) => void }) {
  const trust = trustItems(useSiteSettings().returnDays);
  // prix affichés dans la devise choisie par le visiteur (USD ou FC)
  const formatPrice = useFormatPrice();
  const router = useAppRouter();
  const { add } = useCart();
  const { isFavorite, toggle } = useFavoriteToggle();
  const base = getPricing(product);
  const fav = isFavorite(product.id);
  const { hasVariants, options, selected, variant, select, isAvailable, stock, inStock, priceDelta } = selection;

  // prix de la variante appliqué au prix normal ET soldé
  const current = base.current + priceDelta;
  const original = base.original != null ? base.original + priceDelta : null;

  // la quantité ne dépasse jamais le stock de la variante choisie
  useEffect(() => {
    if (stock > 0 && qty > stock) onQtyChange(stock);
  }, [stock, qty, onQtyChange]);

  const addToCart = (silent?: boolean) =>
    add(product, qty, { silent, variantId: variant?.id ?? null, variantLabel: variant?.label ?? null, priceDelta });

  return (
    <div className="flex min-w-0 flex-col">
      {/* titre, avec favoris et partage à portée (ils ne passent plus à la ligne sous les boutons d'achat) */}
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-xl sm:text-2xl">{product.name}</h1>
        <div className="flex shrink-0 gap-2 pt-0.5">
          <button
            aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
            aria-pressed={fav}
            onClick={() => toggle(product.id, product.name)}
            className={cn("grid size-11 place-items-center rounded-full bg-chip transition-colors hover:bg-danger-100 active:scale-90", fav && "bg-danger-100")}
          >
            <Heart size={20} variant={fav ? "Bold" : "Linear"} className={fav ? "text-danger" : undefined} />
          </button>
          <ProductShareMenu name={product.name} />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        {product.reviewsCount > 0 ? (
          <>
            <Stars rating={product.rating} count={product.reviewsCount} size={15} />
            <a href="#avis" className="touch-target relative text-sm text-ink-2 underline-offset-2 hover:text-primary hover:underline">Voir les avis</a>
          </>
        ) : (
          <a href="#avis" className="touch-target relative text-sm text-ink-2 underline-offset-2 hover:text-primary hover:underline">Pas encore d&apos;avis</a>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-line-3 py-4 sm:mt-5 sm:py-5">
        <Price current={current} original={original} size="xl" className="max-sm:[&>span:first-child]:text-xl" />
        {base.onSale && (
          <span className="text-sm font-semibold text-danger">
            −{base.percent} % · vous économisez {formatPrice(base.saving)}
          </span>
        )}
      </div>

      <p className="mt-4 text-sm text-ink-2 sm:mt-5">{product.description}</p>

      {product.features.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {product.features.slice(0, 5).map((f) => (
            <li key={f} className="flex items-center gap-3 text-sm">
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
              <legend className="mb-2 text-sm font-bold">
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
                        "relative flex h-12 min-w-12 items-center justify-center gap-2 rounded-box border-2 px-4 text-sm font-semibold transition active:scale-95 sm:h-10 sm:min-w-0 sm:rounded-md sm:px-3.5 sm:text-sm",
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
        <span className={cn("flex items-center gap-1.5 text-sm font-semibold", inStock ? (stock <= product.stockThreshold ? "text-warn" : "text-primary") : "text-danger")}>
          {inStock ? <TickCircle size={16} variant="Bold" /> : <CloseCircle size={16} variant="Bold" />}
          {stockLabel(stock, product.stockThreshold)}
        </span>
        {product.freeShipping ? <Pill tone="green">Livraison offerte</Pill> : product.shippingFee ? <Pill tone="dark">{formatPrice(product.shippingFee)} livraison</Pill> : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-6">
        {/* mobile : quantité + « Ajouter » vivent dans la barre d'achat collante */}
        <QuantityStepper value={qty} onChange={onQtyChange} max={Math.max(1, stock)} className="max-lg:hidden" />
        <Button size="md" disabled={!inStock} onClick={() => addToCart()} leftIcon={<Bag2 size={18} variant="Bold" />} className="flex-1 max-lg:hidden sm:flex-none">
          Ajouter au panier
        </Button>
        <Button
          variant="secondary"
          disabled={!inStock}
          onClick={() => {
            addToCart(true);
            router.push(ROUTES.cart);
          }}
          className="min-w-0 max-sm:basis-full sm:flex-none"
        >
          Commander maintenant
        </Button>
      </div>

      <div className={cn("mt-5 grid gap-2 sm:mt-6 sm:gap-3", trust.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {trust.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex flex-col items-center gap-1.5 rounded-box bg-page/60 p-2.5 text-center sm:flex-row sm:gap-3 sm:p-3 sm:text-left">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-primary"><Icon size={20} variant="Bold" /></span>
            <span className="leading-[16px]">
              <span className="block text-xs font-bold sm:text-sm">{title}</span>
              <span className="hidden text-xs text-ink-2 sm:inline">{text}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
