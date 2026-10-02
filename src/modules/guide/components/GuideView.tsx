"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { Box, Messages2, ShoppingCart, TruckFast, Wallet3 } from "iconsax-reactjs";
import { useRef } from "react";
import { ROUTES } from "@/config/routes";
import { Reveal, RevealGroup, RevealItem } from "@/shared/animations/Reveal";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { cn } from "@/shared/lib/cn";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { DELIVERY, PAYMENT_INFO, STEPS } from "../mocks/content";
import { Faq } from "./Faq";

const ICONS = [Box, ShoppingCart, Messages2, Wallet3, TruckFast];

function Stepper() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return (
    <ol ref={ref} className="relative mt-8 space-y-5 pl-[60px] sm:mt-10 sm:space-y-8 sm:pl-20">
      <span aria-hidden className="absolute bottom-6 left-[21px] top-6 w-[3px] rounded-full bg-chip sm:left-[35px]" />
      <motion.span aria-hidden style={{ scaleY }} className="absolute bottom-6 left-[21px] top-6 w-[3px] origin-top rounded-full bg-primary sm:left-[35px]" />
      {STEPS.map((s, i) => {
        const Icon = ICONS[i];
        return (
          <li key={s.title} className="relative">
            <motion.span initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true, amount: 0.8 }} transition={{ type: "spring", stiffness: 300, damping: 15 }} className="absolute -left-[60px] top-0 grid size-11 place-items-center rounded-full bg-primary text-white ring-4 ring-white sm:-left-20 sm:size-[72px]">
              <Icon size={22} variant="Bold" />
            </motion.span>
            <Reveal direction="up" className="rounded-box border border-line-3 p-4 transition-colors hover:border-primary sm:p-6">
              <span className="text-[12px] font-bold uppercase tracking-wider text-primary">Étape {i + 1}</span>
              <h3 className="mt-1 text-[17px] leading-[23px] sm:text-[19px] sm:leading-[26px]">{s.title}</h3>
              <p className="mt-1.5 text-[14px] leading-[22px] text-ink-2 sm:mt-2 sm:leading-[23px]">{s.text}</p>
            </Reveal>
          </li>
        );
      })}
    </ol>
  );
}

export function GuideView() {
  return (
    <>
      <Breadcrumb items={[{ label: "Guide d'achat" }]} />

      <Block pad="none" className="p-4 text-center sm:p-[30px]">
        <Reveal><span className="inline-block rounded-full bg-primary-50 px-4 py-1.5 text-[12px] font-bold uppercase tracking-wider text-primary">Guide d&apos;achat</span></Reveal>
        <Reveal delay={0.08}><h1 className="mx-auto mt-4 max-w-[640px] text-[26px] font-extrabold leading-[32px] sm:text-[40px] sm:leading-[48px]">Comment commander chez <span className="text-primary">Celebobo</span> ?</h1></Reveal>
        <Reveal delay={0.16}><p className="mx-auto mt-3 max-w-[560px] text-[14px] leading-[22px] text-ink-2 sm:mt-4 sm:text-[15px] sm:leading-[26px]">Cinq étapes simples, sans paiement en ligne risqué : vous gardez le contrôle du début à la fin.</p></Reveal>
        <div className="mx-auto max-w-[760px] text-left"><Stepper /></div>
        <Reveal className="mt-8 flex flex-col gap-2.5 sm:mt-10 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
          <Button href={ROUTES.products} size="lg" className="max-sm:w-full">Commencer mes achats</Button>
          <Button href={ROUTES.assistant} size="lg" variant="outline" className="max-sm:w-full">Poser une question à l&apos;assistant</Button>
        </Reveal>
      </Block>

      <Block pad="none" className="p-4 sm:p-[30px]">
        <Reveal><h2 className="text-[16px] uppercase sm:text-section">Modes de paiement</h2></Reveal>
        <RevealGroup className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {PAYMENT_INFO.map((p) => (
            <RevealItem key={p.name}>
              <div className="group h-full rounded-box border border-line-3 p-4 transition-all sm:p-5 duration-300 hover:-translate-y-1.5 hover:border-transparent hover:bg-chip">
                <span className={cn("inline-block rounded-md px-3 py-1.5 text-[13px] font-bold text-white transition-transform duration-300 group-hover:scale-110", p.color)}>{p.name}</span>
                <p className="mt-3 text-[14px] leading-[22px] text-ink-2">{p.text}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Block>

      <Block pad="none" className="p-4 sm:p-[30px]">
        <Reveal><h2 className="text-[16px] uppercase sm:text-section">Politique de livraison</h2></Reveal>
        {/* Mobile : cartes empilées */}
        <ul className="mt-4 space-y-2.5 sm:hidden">
          {DELIVERY.map((d) => (
            <li key={d.zone} className="rounded-box border border-line-3 p-4">
              <p className="text-[15px] font-bold">{d.zone}</p>
              <dl className="mt-2 grid grid-cols-2 gap-3 text-[13px]">
                <div><dt className="text-[11px] font-semibold uppercase text-ink-3">Délai</dt><dd className="mt-0.5 font-medium">{d.delay}</dd></div>
                <div><dt className="text-[11px] font-semibold uppercase text-ink-3">Frais</dt><dd className="mt-0.5 font-medium text-ink-2">{d.fee}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
        <Reveal delay={0.1} className="mt-6 hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[520px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-line-3 text-[12px] uppercase tracking-wide text-ink-3">
                <th className="py-3 pr-4 font-semibold">Zone</th><th className="py-3 pr-4 font-semibold">Délai</th><th className="py-3 font-semibold">Frais</th>
              </tr>
            </thead>
            <tbody>
              {DELIVERY.map((d) => (
                <tr key={d.zone} className="border-b border-line-3/70 transition-colors hover:bg-primary-50">
                  <td className="py-4 pr-4 font-bold">{d.zone}</td><td className="py-4 pr-4">{d.delay}</td><td className="py-4 text-ink-2">{d.fee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </Block>

      <Block pad="none" className="p-4 sm:p-[30px]">
        <Reveal><h2 className="text-[16px] uppercase sm:text-section">Questions fréquentes</h2></Reveal>
        <div className="mt-4"><Faq /></div>
      </Block>
    </>
  );
}
