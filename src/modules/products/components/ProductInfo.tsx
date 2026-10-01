"use client";

import { useRouter } from "next/navigation";
import { Bag2, Copy, Heart, Refresh2, ShieldTick, TickCircle, CloseCircle, Truck } from "iconsax-reactjs";
import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { Pill } from "@/shared/ui/Badges";
import { Button } from "@/shared/ui/Button";
import { Price } from "@/shared/ui/Price";
import { QuantityStepper } from "@/shared/ui/QuantityStepper";
import { Stars } from "@/shared/ui/Stars";
import { toast } from "@/shared/ui/Toast";
import { useCart } from "@/modules/cart/hooks/useCart";
import { useFavoriteToggle } from "@/modules/favorites/hooks/useFavorites";
import type { Product } from "../types";
import { getPricing } from "../utils";

const TRUST = [
  { icon: Truck, title: "Livraison rapide", text: "24–48 h à Kinshasa" },
  { icon: Refresh2, title: "Retour 30 jours", text: "Satisfait ou remboursé" },
  { icon: ShieldTick, title: "Paiement mobile", text: "Orange, Airtel, M-Pesa" },
];

export function ProductInfo({ product }: { product: Product }) {
  const router = useRouter();
  const { add } = useCart();
  const { isFavorite, toggle } = useFavoriteToggle();
  const [qty, setQty] = useState(1);
  const pricing = getPricing(product);
  const fav = isFavorite(product.id);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  return (
    <div className="flex min-w-0 flex-col">
      <p className="text-[12px] font-bold uppercase tracking-wider text-primary">{product.category}</p>
      <h1 className="mt-2 text-[24px] leading-[30px] sm:text-[28px] sm:leading-[34px]">{product.name}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Stars rating={product.rating} count={product.reviewsCount} size={15} />
        <a href="#avis" className="text-[13px] text-ink-2 underline-offset-2 hover:text-primary hover:underline">Voir les avis</a>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-y border-line-3 py-5">
        <Price current={pricing.current} original={pricing.original} size="xl" />
        {pricing.onSale && <Pill tone="red" className="h-[26px] text-[12px]">-{pricing.percent}%</Pill>}
        {pricing.onSale && <span className="text-[13px] font-semibold text-primary">Vous économisez {formatPrice(pricing.saving)}</span>}
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

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className={cn("flex items-center gap-1.5 text-[13px] font-semibold", product.inStock ? "text-primary" : "text-danger")}>
          {product.inStock ? <TickCircle size={16} variant="Bold" /> : <CloseCircle size={16} variant="Bold" />}
          {product.inStock ? "En stock" : "Rupture de stock"}
        </span>
        {product.freeShipping ? <Pill tone="green">Livraison offerte</Pill> : product.shippingFee ? <Pill tone="dark">{formatPrice(product.shippingFee)} livraison</Pill> : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <QuantityStepper value={qty} onChange={setQty} />
        <Button size="md" disabled={!product.inStock} onClick={() => add(product, qty)} leftIcon={<Bag2 size={18} variant="Bold" />} className="flex-1 sm:flex-none">
          Ajouter au panier
        </Button>
        <Button
          variant="dark"
          disabled={!product.inStock}
          onClick={() => {
            add(product, qty, { silent: true });
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
        <button aria-label="Copier le lien" onClick={share} className="grid size-[45px] place-items-center rounded-box bg-chip transition-colors hover:bg-primary hover:text-white">
          <Copy size={19} />
        </button>
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
