"use client";

import { useCallback, useMemo, useState } from "react";
import type { Product, ProductVariant } from "../types";

type Selected = Record<string, string>;

const matches = (v: ProductVariant, sel: Selected, ignore?: string) => Object.entries(sel).every(([k, val]) => k === ignore || v.attributes[k] === val);

/**
 * Sélection de variante (couleur, stockage…) pour une fiche produit.
 * - choisit par défaut la première variante en stock ;
 * - une valeur d'option est « disponible » s'il existe une variante en stock compatible avec le reste de la sélection ;
 * - changer une option qui rend la combinaison indisponible bascule automatiquement les autres options vers une combinaison valide.
 */
export function useVariantSelection(product: Product) {
  const options = product.variantOptions ?? [];
  const variants = product.variants ?? [];
  const hasVariants = options.length > 0 && variants.length > 0;

  const [selected, setSelected] = useState<Selected>(() => {
    if (!hasVariants) return {};
    const first = variants.find((v) => v.stock > 0) ?? variants[0];
    return { ...first.attributes };
  });

  const variant = useMemo(() => (hasVariants ? variants.find((v) => options.every((o) => v.attributes[o.name] === selected[o.name])) : undefined), [hasVariants, variants, options, selected]);

  const isAvailable = useCallback((name: string, value: string) => variants.some((v) => v.attributes[name] === value && v.stock > 0 && matches(v, selected, name)), [variants, selected]);

  const select = useCallback(
    (name: string, value: string) => {
      setSelected((cur) => {
        const next = { ...cur, [name]: value };
        if (variants.some((v) => v.stock > 0 && matches(v, next))) return next;
        // combinaison indisponible : on cherche la meilleure variante en stock contenant cette valeur
        const fallback = variants.find((v) => v.stock > 0 && v.attributes[name] === value) ?? variants.find((v) => v.attributes[name] === value);
        return fallback ? { ...fallback.attributes } : next;
      });
    },
    [variants],
  );

  const stock = hasVariants ? (variant?.stock ?? 0) : product.stock;
  /** Écart de prix de la variante par rapport au prix du produit (0 si identique / sans variante). */
  const priceDelta = variant?.price != null ? variant.price - product.price : 0;

  return { options, hasVariants, selected, variant, select, isAvailable, stock, inStock: stock > 0, priceDelta, image: variant?.image ?? null };
}

export type VariantSelection = ReturnType<typeof useVariantSelection>;
