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
    <motion.article layout className="group grid grid-cols-[104px_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-box py-3 transition-shadow hover:shadow-[0_10px_34px_rgba(0,0,0,.09)] sm:flex sm:flex-row sm:gap-5 sm:p-4">
      <Link href={ROUTES.product(product.id)} className="relative block aspect-square w-full shrink-0 self-start overflow-hidden rounded-box bg-page/40 sm:aspect-[4/3] sm:w-[220px]">
        {product.image && <Image src={product.image} alt={product.name} fill sizes="(min-width:640px) 220px, 104px" className="object-cover transition-transform duration-700 group-hover:scale-110" />}
        <div className="absolute left-2 top-2">{pricing.onSale ? <SaveBadge amount={pricing.saving} /> : isNew(product) ? <NewBadge /> : null}</div>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Stars rating={product.rating} count={product.reviewsCount} />
        <Link href={ROUTES.product(product.id)} className="mt-1.5 line-clamp-2 text-[14px] font-bold leading-[18px] transition-colors hover:text-primary sm:mt-2 sm:line-clamp-none sm:text-[16px] sm:leading-[20px]">{product.name}</Link>
        <p className="mt-2 hidden line-clamp-2 text-[13px] leading-[20px] text-ink-2 sm:block">{product.description}</p>
        <ul className="mt-2 hidden flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2 md:flex">
          {product.features.slice(0, 3).map((f) => (
            <li key={f} className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-ink-2" />{f}</li>
          ))}
        </ul>
        <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3">
          {product.freeShipping ? <Pill tone="green">Livraison offerte</Pill> : product.shippingFee ? <Pill tone="dark">{formatPrice(product.shippingFee)} livraison</Pill> : null}
          <Pill tone={product.inStock ? "gray" : "red"}>{product.inStock ? "En stock" : "Rupture"}</Pill>
        </div>
      </div>
      <div className="col-span-2 flex shrink-0 flex-row items-center justify-between gap-3 border-t border-line-3/70 pt-2 sm:w-[170px] sm:flex-col sm:items-end sm:justify-center sm:border-0 sm:pt-0">
        <Price current={pricing.current} original={pricing.original} size="lg" className="sm:justify-end" />
        <div className="flex items-center gap-2">
          <button
            aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
            onClick={() => toggle(product.id, product.name)}
            className={cn("grid size-11 place-items-center rounded-full bg-page transition-colors hover:bg-danger-100 active:scale-90 sm:size-[34px]", fav ? "text-danger" : "text-ink-3")}
          >
            <Heart size={16} variant={fav ? "Bold" : "Linear"} />
          </button>
          <Button size="sm" disabled={!product.inStock} onClick={() => add(product)} leftIcon={<Bag2 size={15} variant="Bold" />}>Ajouter</Button>
        </div>
      </div>
    </motion.article>
  );
}
