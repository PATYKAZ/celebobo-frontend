"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ROUTES } from "@/config/routes";
import { Reveal } from "@/shared/animations/Reveal";
import { Block } from "@/shared/ui/Block";
import { Tabs } from "@/shared/ui/Tabs";
import Link from "next/link";
import { ArrowRight2 } from "iconsax-reactjs";
import { useProducts } from "@/modules/products/hooks/useProducts";
import type { ProductListParams } from "@/modules/products/types";
import type { HomeCatalog } from "../types";
import { ProductCarousel } from "./ProductCarousel";

type Tab = "best" | "new" | "popular";

const TABS: { value: Tab; label: string }[] = [
  { value: "best", label: "Meilleures ventes" },
  { value: "new", label: "Nouveautés" },
  { value: "popular", label: "Populaires" },
];

const POPULAR: ProductListParams = { ordering: "-rating", pageSize: 10 };

/** « Meilleures ventes » et « Nouveautés » viennent de l'accueil (un seul appel) ; « Populaires » est chargé à l'ouverture. */
function TabPanel({ tab, catalog }: { tab: Tab; catalog: HomeCatalog | null }) {
  const popular = useProducts(POPULAR, tab === "popular");
  if (tab === "popular") return <ProductCarousel products={popular.data?.results} loading={popular.isLoading} />;
  return <ProductCarousel products={catalog ? (tab === "best" ? catalog.bestSellers : catalog.newArrivals) : undefined} loading={!catalog} />;
}

export function ProductTabs({ catalog }: { catalog: HomeCatalog | null }) {
  const [tab, setTab] = useState<Tab>("best");
  return (
    <Reveal>
      <Block pad="none" className="min-w-0 px-3 pb-4 pt-4 sm:px-[30px] sm:pb-8 sm:pt-7">
        <div className="flex items-start justify-between gap-4">
          <Tabs tabs={TABS} value={tab} onChange={setTab} className="min-w-0 flex-1" />
          <Link href={ROUTES.products} className="group hidden items-center gap-0.5 pt-1 text-link capitalize text-ink-2 hover:text-primary sm:inline-flex">
            Voir tout <ArrowRight2 size={13} variant="Bold" className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="mt-3 sm:mt-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <TabPanel tab={tab} catalog={catalog} />
            </motion.div>
          </AnimatePresence>
        </div>
        <Link href={ROUTES.products} className="mt-3 flex h-12 items-center justify-center gap-1 rounded-box bg-chip text-[13px] font-semibold active:scale-[0.98] sm:hidden">
          Voir tous les produits <ArrowRight2 size={14} variant="Bold" />
        </Link>
      </Block>
    </Reveal>
  );
}
