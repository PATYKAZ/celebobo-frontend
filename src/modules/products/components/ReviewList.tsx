"use client";

import { AnimatePresence, motion } from "motion/react";
import { formatRelative } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Stars } from "@/shared/ui/Stars";
import type { Review } from "../types";

export function ReviewList({ reviews, loading }: { reviews?: Review[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[84px] w-full" />)}
      </div>
    );
  }
  if (!reviews?.length) return <p className="py-6 text-center text-[14px] text-ink-3">Aucun avis pour le moment. Soyez le premier à donner le vôtre !</p>;
  return (
    <ul className="flex flex-col divide-y divide-line-3">
      <AnimatePresence initial={false}>
        {reviews.map((r) => (
          <motion.li key={r.id} layout initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 py-5">
            <Avatar src={r.user.avatar} name={r.user.name} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-[14px] font-bold">{r.user.name}</p>
                <Stars rating={r.rating} hideCount />
                <span className="text-[12px] text-ink-3">{formatRelative(r.dateCreated)}</span>
              </div>
              <p className="mt-2 text-[14px] leading-[22px] text-ink-2">{r.message}</p>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
