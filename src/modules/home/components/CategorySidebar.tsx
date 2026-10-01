"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight2, Flash } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { Skeleton } from "@/shared/ui/Skeleton";
import { CategoryIcon } from "@/modules/categories/components/CategoryIcon";
import { useCategories } from "@/modules/categories/hooks/useCategories";

/** Sidebar catégories (309×446) : ligne « SOLDES » rouge puis les catégories, avec glissement au survol. */
export function CategorySidebar() {
  const { data: categories, isLoading } = useCategories();

  return (
    <aside className="hidden h-[446px] flex-col rounded-box bg-white px-[30px] py-5 lg:flex">
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
              <motion.li key={c.id} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.04, duration: 0.4 }}>
                <Link href={ROUTES.category(c.id)} className="group flex items-center gap-3 text-[13px] font-semibold capitalize leading-[19.5px] transition-all duration-300 hover:translate-x-1.5 hover:text-primary">
                  <CategoryIcon name={c.icon} size={16} variant="Bold" />
                  <span className="flex-1 truncate">{c.name}</span>
                  <ArrowRight2 size={13} variant="Bold" className="opacity-60 transition-transform duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                </Link>
              </motion.li>
            ))}
      </ul>
    </aside>
  );
}
