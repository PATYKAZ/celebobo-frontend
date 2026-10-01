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
import { ProductCarousel } from "./ProductCarousel";

type Tab = "best" | "new" | "popular";

const TABS: { value: Tab; label: string }[] = [
  { value: "best", label: "Meilleures ventes" },
  { value: "new", label: "Nouveautés" },
  { value: "popular", label: "Populaires" },
];

const PARAMS: Record<Tab, ProductListParams> = {
  best: { ordering: "-sales", pageSize: 10 },
  new: { badge: "new", ordering: "-date_added", pageSize: 10 },
  popular: { ordering: "-rating", pageSize: 10 },
};

function TabPanel({ tab }: { tab: Tab }) {
  const { data, isLoading } = useProducts(PARAMS[tab]);
  return <ProductCarousel products={data?.results} loading={isLoading} />;
}

export function ProductTabs() {
  const [tab, setTab] = useState<Tab>("best");
  return (
    <Reveal>
      <Block pad="none" className="px-4 pb-8 pt-7 sm:px-[30px]">
        <div className="flex items-start justify-between gap-4">
          <Tabs tabs={TABS} value={tab} onChange={setTab} />
          <Link href={ROUTES.products} className="group hidden items-center gap-0.5 pt-1 text-link capitalize text-ink-2 hover:text-primary sm:inline-flex">
            Voir tout <ArrowRight2 size={13} variant="Bold" className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="mt-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <TabPanel tab={tab} />
            </motion.div>
          </AnimatePresence>
        </div>
      </Block>
    </Reveal>
  );
}
