"use client";

import { AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Bag2, Trash } from "iconsax-reactjs";
import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
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
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <Reveal>
            <Block>
              <div className="flex items-center justify-between gap-4">
                <h1 className="text-h-page">Mon panier <span className="text-[16px] font-medium text-ink-3">({count})</span></h1>
                <button onClick={() => setConfirmClear(true)} className="flex items-center gap-1.5 text-[13px] text-ink-2 transition-colors hover:text-danger">
                  <Trash size={15} /> Vider le panier
                </button>
              </div>
              <ul className="mt-4">
                <AnimatePresence initial={false}>
                  {items.map((it) => (
                    <CartLine key={it.productId} item={it} onQuantity={(q) => setQuantity(it.productId, q)} onRemove={() => remove(it.productId)} />
                  ))}
                </AnimatePresence>
              </ul>
              <Button href={ROUTES.products} variant="chip" leftIcon={<ArrowLeft size={16} />} className="mt-4">Continuer mes achats</Button>
            </Block>
          </Reveal>

          <Reveal delay={0.1} direction="left">
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
