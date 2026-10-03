"use client";

import { AnimatePresence, motion } from "motion/react";
import { TickCircle } from "iconsax-reactjs";
import { useState } from "react";
import { Tabs } from "@/shared/ui/Tabs";
import { useProductReviews } from "../hooks/useProducts";
import type { Product } from "../types";
import { ReviewForm } from "./ReviewForm";
import { ReviewList } from "./ReviewList";
import { ReviewSummary } from "./ReviewSummary";

type Tab = "description" | "features" | "care" | "delivery" | "reviews";

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((f) => (
        <li key={f} className="flex items-start gap-3 rounded-box bg-page/60 p-3.5 text-[14px] leading-[21px]">
          <TickCircle size={18} variant="Bold" className="mt-0.5 shrink-0 text-primary" /> {f}
        </li>
      ))}
    </ul>
  );
}

/** Onglets de la fiche : description, caractéristiques, entretien, livraison, avis. */
export function ProductTabs({ product }: { product: Product }) {
  const [tab, setTab] = useState<Tab>("description");
  const { data: reviews, isLoading } = useProductReviews(product.slug);

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: "description", label: "Description" },
    { value: "features", label: "Caractéristiques" },
    { value: "care", label: "Entretien" },
    { value: "delivery", label: "Livraison" },
    { value: "reviews", label: "Avis", count: reviews?.length ?? product.reviewsCount },
  ];

  const empty = <p className="text-[14px] text-ink-3">Aucune information disponible.</p>;

  return (
    <div id="avis" className="scroll-mt-4">
      <Tabs tabs={tabs} value={tab} onChange={setTab} className="border-b border-line-3 pb-4 [&_button]:text-[15px] sm:[&_button]:text-[18px]" />
      <div className="min-h-[200px] pt-6">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {tab === "description" && (
              <div className="max-w-[860px] text-[14px] leading-[25.2px] text-ink-2">
                <p className="font-semibold text-ink">{product.description}</p>
                {product.longDescription ? <p className="mt-3">{product.longDescription}</p> : null}
              </div>
            )}
            {tab === "features" && (product.features.length ? <Bullets items={product.features} /> : empty)}
            {tab === "care" && (product.charaEntretienList.length ? <Bullets items={product.charaEntretienList} /> : empty)}
            {tab === "delivery" && (
              <div className="grid gap-4 md:grid-cols-2">
                {[product.deliveryPolicyPhase1, product.deliveryPolicyPhase2].map((t, i) =>
                  t ? (
                    <div key={i} className="rounded-box bg-page/60 p-5">
                      <span className="grid size-8 place-items-center rounded-full bg-primary text-[14px] font-bold text-white">{i + 1}</span>
                      <p className="mt-3 text-[14px] leading-[22px] text-ink-2">{t}</p>
                    </div>
                  ) : null,
                )}
                {!product.deliveryPolicyPhase1 && !product.deliveryPolicyPhase2 && empty}
              </div>
            )}
            {tab === "reviews" && (
              <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
                <div>
                  {reviews && reviews.length > 0 && <ReviewSummary reviews={reviews} />}
                  <ReviewList reviews={reviews} loading={isLoading} />
                </div>
                <ReviewForm slug={product.slug} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
