"use client";

import { AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Bag2, Trash } from "iconsax-reactjs";
import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { formatPrice } from "@/shared/lib/format";
import { Reveal } from "@/shared/animations/Reveal";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ConfirmDialog } from "@/modules/admin/ui/ConfirmDialog";
import { useCart } from "../hooks/useCart";
import { CartLine } from "./CartLine";
import { CartSummary } from "./CartSummary";
import { RecommendedProducts } from "./RecommendedProducts";

export function CartView() {
  const { items, count, total, savings, isEmpty, setQuantity, remove, clear } = useCart();
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <>
      <Breadcrumb items={[{ label: "Panier" }]} />

      {isEmpty ? (
        <Block>
          <EmptyState
            icon={<Bag2 size={46} variant="Bulk" />}
            title="Votre panier est vide"
            description="Ajoutez des produits à votre panier : une fois la commande envoyée, un revendeur Celebobo vous contacte pour finaliser."
            action={<Button href={ROUTES.products} rightIcon={<ArrowRight size={16} />}>Découvrir la boutique</Button>}
          />
        </Block>
      ) : (
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1fr_380px]">
          <Reveal className="min-w-0">
            <Block pad="none" className="p-4 sm:p-[30px]">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-[22px] leading-[28px] sm:text-h-page">Mon panier <span className="text-[15px] font-medium text-ink-3 sm:text-[16px]">({count})</span></h1>
                <button onClick={() => setConfirmClear(true)} className="flex min-h-11 items-center gap-1.5 rounded-full px-2 text-[13px] text-ink-2 transition-colors hover:text-danger active:scale-95">
                  <Trash size={16} /> <span className="max-sm:hidden">Vider le panier</span><span className="sm:hidden">Vider</span>
                </button>
              </div>
              <ul className="mt-2 sm:mt-4">
                <AnimatePresence initial={false}>
                  {items.map((it) => (
                    <CartLine key={`${it.productId}-${it.variantId ?? 0}`} item={it} onQuantity={(q) => setQuantity(it.productId, q, it.variantId ?? null)} onRemove={() => remove(it.productId, it.variantId ?? null)} />
                  ))}
                </AnimatePresence>
              </ul>
              <Button href={ROUTES.products} variant="chip" leftIcon={<ArrowLeft size={16} />} className="mt-4 max-sm:w-full">Continuer mes achats</Button>
            </Block>
          </Reveal>

          <Reveal delay={0.1} direction="up" className="min-w-0">
            <CartSummary
              subtotal={total}
              savings={savings}
              count={count}
              actions={<Button href={ROUTES.checkout} size="lg" fullWidth rightIcon={<ArrowRight size={17} />}>Passer la commande</Button>}
            />
          </Reveal>
        </div>
      )}

      <RecommendedProducts excludeIds={items.map((i) => i.productId)} />

      {/* Mobile : barre de commande collante au-dessus de la barre d'onglets */}
      {!isEmpty && (
        <>
          <div aria-hidden className="h-20 lg:hidden" />
          <div className="fixed inset-x-0 bottom-tabbar z-40 border-t border-line-3 bg-white/95 px-4 pb-3 pt-3 backdrop-blur-xl lg:hidden">
            <div className="mx-auto flex max-w-[640px] items-center gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase leading-[14px] text-ink-3">Total · {count} article{count > 1 ? "s" : ""}</p>
                <p className="text-[20px] font-extrabold leading-[26px] text-primary">{formatPrice(total)}</p>
              </div>
              <Button href={ROUTES.checkout} size="lg" className="ml-auto flex-1 sm:flex-none" rightIcon={<ArrowRight size={17} />}>Commander</Button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clear();
          setConfirmClear(false);
        }}
        title="Vider le panier ?"
        message="Tous les articles seront retirés de votre panier."
        confirmLabel="Vider"
      />
    </>
  );
}
