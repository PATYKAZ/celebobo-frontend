"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Bag2, Heart } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { NewBadge, Pill, SaveBadge } from "@/shared/ui/Badges";
import { Button } from "@/shared/ui/Button";
import { Price } from "@/shared/ui/Price";
import { Stars } from "@/shared/ui/Stars";
import { useCart } from "@/modules/cart/hooks/useCart";
import { useFavoriteToggle } from "@/modules/favorites/hooks/useFavorites";
import type { Product } from "../types";
import { getPricing, isNew } from "../utils";

/** Carte produit horizontale (vue « liste »). */
export function ProductListItem({ product }: { product: Product }) {
  const { add } = useCart();
  const { isFavorite, toggle } = useFavoriteToggle();
  const pricing = getPricing(product);
  const fav = isFavorite(product.id);

  return (
    <motion.article layout className="group flex flex-col gap-5 rounded-box p-4 transition-shadow hover:shadow-[0_10px_34px_rgba(0,0,0,.09)] sm:flex-row">
      <Link href={ROUTES.product(product.id)} className="relative block aspect-[4/3] w-full shrink-0 overflow-hidden rounded-box bg-page/40 sm:w-[220px]">
        {product.image && <Image src={product.image} alt={product.name} fill sizes="220px" className="object-cover transition-transform duration-700 group-hover:scale-110" />}
        <div className="absolute left-2 top-2">{pricing.onSale ? <SaveBadge amount={pricing.saving} /> : isNew(product) ? <NewBadge /> : null}</div>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Stars rating={product.rating} count={product.reviewsCount} />
        <Link href={ROUTES.product(product.id)} className="mt-2 text-[16px] font-bold leading-[20px] transition-colors hover:text-primary">{product.name}</Link>
        <p className="mt-2 line-clamp-2 text-[13px] leading-[20px] text-ink-2">{product.description}</p>
        <ul className="mt-2 hidden flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2 md:flex">
          {product.features.slice(0, 3).map((f) => (
            <li key={f} className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-ink-2" />{f}</li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.freeShipping ? <Pill tone="green">Livraison offerte</Pill> : product.shippingFee ? <Pill tone="dark">{formatPrice(product.shippingFee)} livraison</Pill> : null}
          <Pill tone={product.inStock ? "gray" : "red"}>{product.inStock ? "En stock" : "Rupture"}</Pill>
        </div>
      </div>
      <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:w-[170px] sm:flex-col sm:items-end sm:justify-center">
        <Price current={pricing.current} original={pricing.original} size="lg" className="sm:justify-end" />
        <div className="flex items-center gap-2">
          <button
            aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
            onClick={() => toggle(product.id, product.name)}
            className={cn("grid size-[34px] place-items-center rounded-full bg-page transition-colors hover:bg-danger-100", fav ? "text-danger" : "text-ink-3")}
          >
            <Heart size={16} variant={fav ? "Bold" : "Linear"} />
          </button>
          <Button size="sm" disabled={!product.inStock} onClick={() => add(product)} leftIcon={<Bag2 size={15} variant="Bold" />}>Ajouter</Button>
        </div>
      </div>
    </motion.article>
  );
}
