"use client";

import { motion } from "motion/react";
import { ArrowRight } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";

const CONFETTI = Array.from({ length: 14 }, (_, i) => ({ id: i, x: Math.cos((i / 14) * Math.PI * 2) * 120, y: Math.sin((i / 14) * Math.PI * 2) * 120, c: ["#1ABA1A", "#FFE400", "#F1352B", "#FFA500"][i % 4] }));

export function OrderSuccess({ orderId, conversationId }: { orderId: number; conversationId: number }) {
  return (
    <Block className="py-16 text-center">
      <div className="relative mx-auto grid size-28 place-items-center">
        {CONFETTI.map((c) => (
          <motion.span key={c.id} className="absolute size-2.5 rounded-full" style={{ background: c.c }} initial={{ x: 0, y: 0, opacity: 1, scale: 0 }} animate={{ x: c.x, y: c.y, opacity: 0, scale: 1 }} transition={{ duration: 1.1, delay: 0.35, ease: "easeOut" }} />
        ))}
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className="grid size-28 place-items-center rounded-full bg-primary">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.3 }} />
          </svg>
        </motion.span>
      </div>
      <motion.h2 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-8 text-[28px] leading-[34px]">Commande #{orderId} envoyée !</motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }} className="mx-auto mt-3 max-w-[460px] text-[14px] leading-[22px] text-ink-2">
        Un revendeur Celebobo va vous répondre dans la discussion pour confirmer la disponibilité et la livraison. Redirection en cours…
      </motion.p>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href={ROUTES.conversation(conversationId)} rightIcon={<ArrowRight size={16} />}>Ouvrir la discussion</Button>
        <Button href={ROUTES.orders} variant="chip">Mes commandes</Button>
      </motion.div>
    </Block>
  );
}
