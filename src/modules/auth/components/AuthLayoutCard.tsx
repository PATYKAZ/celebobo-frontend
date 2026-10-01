"use client";

import { motion } from "motion/react";
import { Bag2, Messages2, ShieldTick, Truck } from "iconsax-reactjs";
import type { ReactNode } from "react";
import { KenBurnsImage } from "@/shared/animations/MotionImage";
import { Reveal } from "@/shared/animations/Reveal";
import { Block } from "@/shared/ui/Block";

const BENEFITS = [
  { icon: Truck, label: "Livraison rapide à Kinshasa" },
  { icon: Messages2, label: "Un revendeur dédié à chaque commande" },
  { icon: ShieldTick, label: "Paiement Mobile Money ou cash" },
];

interface Props {
  title: string;
  subtitle: string;
  image: string;
  headline: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Carte blanche centrée + panneau visuel animé (desktop). */
export function AuthLayoutCard({ title, subtitle, image, headline, children, footer }: Props) {
  return (
    <Block pad="none" className="overflow-hidden">
      <div className="grid lg:grid-cols-[1fr_1.05fr]">
        <Reveal className="mx-auto w-full max-w-[520px] px-5 py-10 sm:px-10 sm:py-14">
          <h1 className="text-h-page text-primary">{title}</h1>
          <p className="mb-8 mt-2 text-[14px] leading-[22px] text-ink-2">{subtitle}</p>
          {children}
          {footer && <div className="mt-8 border-t border-line-3 pt-6 text-center text-[14px] text-ink-2">{footer}</div>}
        </Reveal>

        <div className="relative hidden min-h-[640px] overflow-hidden bg-ink-dark lg:block">
          <KenBurnsImage src={image} alt="" fill sizes="50vw" priority className="opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-primary/30" />
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute right-10 top-10 flex items-center gap-3 rounded-box bg-white/95 px-4 py-3">
            <span className="grid size-10 place-items-center rounded-full bg-primary text-white"><Bag2 size={20} variant="Bold" /></span>
            <span className="text-[13px] leading-[17px]"><strong className="block">+12 000 commandes</strong><span className="text-ink-3">livrées avec le sourire</span></span>
          </motion.div>
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <h2 className="max-w-[420px] text-[30px] leading-[36px]">{headline}</h2>
            <ul className="mt-6 space-y-3">
              {BENEFITS.map(({ icon: Icon, label }, i) => (
                <motion.li key={label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.12 }} className="flex items-center gap-3 text-[14px]">
                  <span className="grid size-8 place-items-center rounded-full bg-white/20"><Icon size={16} variant="Bold" /></span>
                  {label}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Block>
  );
}
