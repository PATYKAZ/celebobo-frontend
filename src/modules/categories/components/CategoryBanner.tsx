"use client";

import { motion } from "motion/react";
import { ParallaxImage } from "@/shared/animations/MotionImage";
import { pluralize } from "@/shared/lib/format";
import { CategoryIcon } from "./CategoryIcon";
import type { Category } from "../types";

/** Bannière de catégorie : image en parallaxe + voile sombre + titre animé. */
export function CategoryBanner({ category }: { category: Category }) {
  return (
    <div className="relative overflow-hidden rounded-box">
      {category.image && (
        <ParallaxImage src={category.image} alt="" fill sizes="1300px" priority wrapperClassName="!absolute inset-0" strength={50} />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      <div className="relative flex min-h-[170px] flex-col justify-center gap-2 px-5 py-6 text-white sm:min-h-[240px] sm:gap-3 sm:px-[60px] sm:py-10">
        <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: 0.1 }} className="grid size-11 place-items-center rounded-full bg-primary sm:size-12">
          <CategoryIcon name={category.icon} size={24} variant="Bold" />
        </motion.span>
        <motion.h1 initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="text-[26px] leading-[32px] sm:text-[40px] sm:leading-[48px]">
          {category.name}
        </motion.h1>
        {category.description && (
          <motion.p initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="max-w-[520px] text-[14px] leading-[22px] text-white/85">
            {category.description}
          </motion.p>
        )}
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="w-fit rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold backdrop-blur">
          {pluralize(category.productsCount, "produit")}
        </motion.span>
      </div>
    </div>
  );
}
