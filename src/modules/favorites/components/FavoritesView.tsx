"use client";

import { Bag2, Heart } from "iconsax-reactjs";
import { AnimatePresence, motion } from "motion/react";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Reveal } from "@/shared/animations/Reveal";
import { pluralize } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { toast } from "@/shared/ui/Toast";
import { ProductGrid } from "@/modules/products/components/ProductGrid";
import { ProductCard } from "@/modules/products/components/ProductCard";
import { useCart } from "@/modules/cart/hooks/useCart";
import { useFavoriteProducts } from "../hooks/useFavorites";
import { useFavoritesStore } from "../store/favorites.store";

export function FavoritesView() {
  const { data, isLoading } = useFavoriteProducts();
  const ids = useFavoritesStore((s) => s.ids);
  const { add } = useCart();
  // retrait immédiat côté UI (le store est mis à jour de façon optimiste)
  const products = data?.filter((p) => ids.includes(p.id));

  const addAll = () => {
    const available = products?.filter((p) => p.inStock) ?? [];
    available.forEach((p) => add(p, 1, { silent: true }));
    toast.success(`${pluralize(available.length, "produit")} ajouté${available.length > 1 ? "s" : ""} au panier`);
  };

  return (
    <>
      <Breadcrumb items={[{ label: "Mes favoris" }]} />
      <Reveal>
        <Block pad="none" className="flex flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-[30px]">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-full bg-danger-100 text-danger"><Heart size={24} variant="Bold" /></span>
            <div>
              <h1 className="text-h-page">Mes favoris</h1>
              <p className="text-[14px] text-ink-2">{pluralize(products?.length ?? ids.length, "produit")} enregistré{(products?.length ?? ids.length) > 1 ? "s" : ""}</p>
            </div>
          </div>
          {!!products?.length && (
            <Button onClick={addAll} leftIcon={<Bag2 size={17} variant="Bold" />} upper={false}>Tout ajouter au panier</Button>
          )}
        </Block>
      </Reveal>

      <Block pad="none" className="p-3 sm:p-6">
        {isLoading ? (
          <ProductGrid loading skeletons={5} />
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            <AnimatePresence mode="popLayout">
              {products.map((p) => (
                <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8, y: 20 }} transition={{ duration: 0.3 }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <EmptyState
            icon={<Heart size={44} variant="Bulk" />}
            title="Aucun favori pour le moment"
            description="Cliquez sur le cœur d'un produit pour le retrouver ici plus tard."
            action={<Button href={ROUTES.products}>Découvrir les produits</Button>}
          />
        )}
      </Block>
    </>
  );
}
