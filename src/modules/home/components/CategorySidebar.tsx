"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight2, Flash } from "@/shared/ui/icons";
import { ROUTES } from "@/config/routes";
import { Skeleton } from "@/shared/ui/Skeleton";
import { CategoryIcon } from "@/modules/categories/components/CategoryIcon";
import { useCategories } from "@/modules/categories/hooks/useCategories";

/** Sidebar catégories (309×446) : ligne « SOLDES » rouge puis les catégories, avec glissement au survol. */
export function CategorySidebar() {
  const { data: categories, isLoading } = useCategories();

  return (
    <aside className="hidden h-[446px] flex-col rounded-box bg-surface px-[30px] py-5 lg:flex">
      <Link href={`${ROUTES.products}?onSale=1`} className="group flex items-center gap-2 text-[14px] font-bold uppercase leading-[21px] text-danger">
        <span className="relative grid size-5 place-items-center">
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-danger/30" />
          <Flash size={16} variant="Bold" className="relative" />
        </span>
        Soldes -40 %
      </Link>

      <ul className="mt-3 flex flex-1 flex-col justify-between">
        {isLoading
          ? Array.from({ length: 10 }, (_, i) => (
              <li key={i}>
                <Skeleton className="h-4 w-full" />
              </li>
            ))
          : categories?.map((c, i) => (
              <motion.li key={c.id} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.04, duration: 0.4 }} className="group/cat relative">
                <Link href={ROUTES.category(c.slug)} className="group flex items-center gap-3 text-[13px] font-semibold capitalize leading-[19.5px] transition-all duration-300 hover:translate-x-1.5 hover:text-primary">
                  <CategoryIcon name={c.icon} size={16} variant="Bold" />
                  <span className="flex-1 truncate">{c.name}</span>
                  <ArrowRight2 size={13} variant="Bold" className="opacity-60 transition-transform duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                </Link>
                {/* sous-catégories : panneau à droite au survol ou au clavier */}
                {c.children.some((x) => x.productsCount > 0) && (
                  <div className="invisible absolute left-full top-1/2 z-30 -translate-y-1/2 pl-9 opacity-0 transition-all duration-200 group-focus-within/cat:visible group-focus-within/cat:opacity-100 group-hover/cat:visible group-hover/cat:opacity-100">
                    <div className="w-[230px] rounded-box bg-surface p-2 shadow-[0_12px_40px_rgba(0,0,0,0.14)]">
                      <Link href={ROUTES.category(c.slug)} className="block rounded-md px-3 py-2 text-[13px] font-bold text-primary hover:bg-primary-50">
                        Tout {c.name} <span className="font-semibold text-ink-3">({c.productsCount})</span>
                      </Link>
                      {c.children
                        .filter((x) => x.productsCount > 0)
                        .map((x) => (
                          <Link key={x.id} href={ROUTES.category(x.slug)} className="flex items-center justify-between rounded-md px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-chip hover:text-primary">
                            {x.name}
                            <span className="text-[11px] text-ink-3">{x.productsCount}</span>
                          </Link>
                        ))}
                    </div>
                  </div>
                )}
              </motion.li>
            ))}
      </ul>
    </aside>
  );
}
