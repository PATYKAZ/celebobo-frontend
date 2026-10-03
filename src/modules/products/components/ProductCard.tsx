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
  const href = ROUTES.product(product.slug);

  return (
    <motion.article
      layout
      className={cn("group relative flex h-full min-w-0 flex-col rounded-box p-2.5 transition-shadow duration-300 hover:shadow-[0_10px_34px_rgba(0,0,0,.09)] sm:p-4", className)}
    >
      {/* Image */}
      <div className="relative">
        <Link href={href} className="relative block aspect-[4/3] overflow-hidden sm:aspect-[192/200] rounded-md border-b border-line-2/10 bg-page/40" aria-label={product.name}>
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority={priority}
              sizes="(min-width:1280px) 224px, (min-width:640px) 33vw, 60vw"
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
          className="absolute right-1 top-1 grid size-9 place-items-center rounded-full bg-white/90 text-ink-3 backdrop-blur transition-colors hover:bg-danger-100 hover:text-danger active:scale-90 sm:right-0 sm:top-0 sm:size-[30px] sm:bg-page"
        >
          <motion.span key={String(fav)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 12 }} className="grid">
            <Heart size={15} variant={fav ? "Bold" : "Linear"} color={fav ? "#F1352B" : "currentColor"} />
          </motion.span>
        </button>

        {/* Ajout rapide */}
        <button
          onClick={() => add(product)}
          disabled={!product.inStock}
          className="absolute inset-x-2 bottom-2 hidden h-9 translate-y-[140%] items-center justify-center gap-2 rounded-md bg-primary text-[12px] font-semibold uppercase text-white opacity-0 transition-all duration-300 hover:bg-primary-dark group-hover:translate-y-0 group-hover:opacity-100 disabled:bg-ink-3 sm:flex"
        >
          <Bag2 size={15} variant="Bold" /> {product.inStock ? "Ajouter" : "Indisponible"}
        </button>
        {/* tactile : pas de survol → bouton panier toujours visible */}
        <button
          onClick={() => add(product)}
          disabled={!product.inStock}
          aria-label="Ajouter au panier"
          className="absolute bottom-1.5 right-1.5 grid size-10 place-items-center rounded-full bg-primary text-white shadow-[0_4px_14px_rgba(26,186,26,.45)] transition-transform active:scale-90 disabled:bg-ink-3 disabled:shadow-none sm:hidden"
        >
          <Bag2 size={18} variant="Bold" />
        </button>
      </div>

      {/* Contenu */}
      <div className="mt-2.5 flex flex-1 flex-col sm:mt-[19px]">
        {product.reviewsCount > 0 || product.rating ? <Stars rating={product.rating} count={product.reviewsCount} /> : <div className="h-[19.5px]" />}
        <Link href={href} className="mt-2 line-clamp-2 min-h-[34px] text-[13px] font-bold leading-[17px] transition-colors hover:text-primary sm:mt-[10px] sm:line-clamp-3 sm:min-h-[50px] sm:text-name">
          {product.name}
        </Link>
        <Price current={pricing.current} original={pricing.original} size="sm" className="mt-1.5 sm:mt-3 sm:[&>span:first-child]:text-[18px]" />

        {/* mobile : une simple ligne de texte (pas de pastilles empilées) ; desktop : pastilles du design */}
        <p className="mt-1.5 text-[11px] font-semibold leading-[15px] text-primary sm:hidden">
          {product.freeShipping ? "Livraison offerte" : product.shippingFee ? `${formatPrice(product.shippingFee)} livraison` : " "}
        </p>
        <div className="mt-3 hidden flex-wrap gap-[6px] sm:flex">
          {product.freeShipping ? <Pill tone="green">Livraison offerte</Pill> : product.shippingFee ? <Pill tone="dark">{formatPrice(product.shippingFee)} livraison</Pill> : null}
          {pricing.onSale && pricing.percent > 0 && <Pill tone="red">-{pricing.percent}%</Pill>}
        </div>

        <p className={cn("mt-auto items-center gap-1.5 pt-2 text-[12px] leading-[20.4px] sm:flex sm:pt-3", product.inStock ? "hidden" : "flex")}>
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
