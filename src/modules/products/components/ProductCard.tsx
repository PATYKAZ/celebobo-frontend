"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Bag2, CloseCircle, Heart, TickCircle } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { NewBadge, Pill, SaveBadge } from "@/shared/ui/Badges";
import { Price } from "@/shared/ui/Price";
import { Stars } from "@/shared/ui/Stars";
import { useCart } from "@/modules/cart/hooks/useCart";
import { useFavoriteToggle } from "@/modules/favorites/hooks/useFavorites";
import type { Product } from "../types";
import { getPricing, isNew } from "../utils";

interface Props {
  product: Product;
  className?: string;
  priority?: boolean;
}

/**
 * Carte produit standard du design (§2.5) :
 * image + bordure basse, cœur wishlist, badge REMISE/NOUVEAU, étoiles, nom, prix, pastilles, stock.
 * Animations : zoom/échange d'image au survol, bouton « Ajouter » qui glisse, cœur qui « pop ».
 */
export function ProductCard({ product, className, priority }: Props) {
  const { add } = useCart();
  const { isFavorite, toggle } = useFavoriteToggle();
  const pricing = getPricing(product);
  const fav = isFavorite(product.id);
  const second = product.images[1];
  const href = ROUTES.product(product.id);

  return (
    <motion.article
      layout
      className={cn("group relative flex h-full flex-col rounded-box p-4 transition-shadow duration-300 hover:shadow-[0_10px_34px_rgba(0,0,0,.09)]", className)}
    >
      {/* Image */}
      <div className="relative">
        <Link href={href} className="relative block aspect-[192/200] overflow-hidden rounded-md border-b border-line-2/10 bg-page/40" aria-label={product.name}>
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority={priority}
              sizes="(min-width:1280px) 224px, (min-width:640px) 33vw, 50vw"
              className={cn("object-cover transition-all duration-700 ease-out group-hover:scale-110", second && "group-hover:opacity-0")}
            />
          ) : (
            <div className="grid h-full place-items-center text-ink-3">
              <Bag2 size={40} />
            </div>
          )}
          {second && (
            <Image src={second} alt="" fill sizes="224px" className="object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-100" />
          )}
        </Link>

        {/* Badges haut-gauche */}
        <div className="absolute left-0 top-0">
          {pricing.onSale ? <SaveBadge amount={pricing.saving} /> : isNew(product) ? <NewBadge className="m-0" /> : null}
        </div>

        {/* Wishlist */}
        <button
          aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={fav}
          onClick={() => toggle(product.id, product.name)}
          className="absolute right-0 top-0 grid size-[30px] place-items-center rounded-full bg-page text-ink-3 transition-colors hover:bg-danger-100 hover:text-danger"
        >
          <motion.span key={String(fav)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 12 }} className="grid">
            <Heart size={15} variant={fav ? "Bold" : "Linear"} color={fav ? "#F1352B" : "currentColor"} />
          </motion.span>
        </button>

        {/* Ajout rapide */}
        <button
          onClick={() => add(product)}
          disabled={!product.inStock}
          className="absolute inset-x-2 bottom-2 flex h-9 translate-y-[140%] items-center justify-center gap-2 rounded-md bg-primary text-[12px] font-semibold uppercase text-white opacity-0 transition-all duration-300 hover:bg-primary-dark group-hover:translate-y-0 group-hover:opacity-100 disabled:bg-ink-3"
        >
          <Bag2 size={15} variant="Bold" /> {product.inStock ? "Ajouter" : "Indisponible"}
        </button>
      </div>

      {/* Contenu */}
      <div className="mt-[19px] flex flex-1 flex-col">
        {product.reviewsCount > 0 || product.rating ? <Stars rating={product.rating} count={product.reviewsCount} /> : <div className="h-[19.5px]" />}
        <Link href={href} className="mt-[10px] line-clamp-3 min-h-[50px] text-name transition-colors hover:text-primary">
          {product.name}
        </Link>
        <Price current={pricing.current} original={pricing.original} className="mt-3" />

        <div className="mt-3 flex flex-wrap gap-[6px]">
          {product.freeShipping ? <Pill tone="green">Livraison offerte</Pill> : product.shippingFee ? <Pill tone="dark">{formatPrice(product.shippingFee)} livraison</Pill> : null}
          {pricing.onSale && pricing.percent > 0 && <Pill tone="red">-{pricing.percent}%</Pill>}
        </div>

        <p className="mt-auto flex items-center gap-1.5 pt-3 text-[12px] leading-[20.4px]">
          {product.inStock ? (
            <>
              <TickCircle size={13} variant="Bold" color="#1ABA1A" /> En stock
            </>
          ) : (
            <>
              <CloseCircle size={13} variant="Bold" color="#F1352B" /> Rupture de stock
            </>
          )}
        </p>
      </div>
    </motion.article>
  );
}
