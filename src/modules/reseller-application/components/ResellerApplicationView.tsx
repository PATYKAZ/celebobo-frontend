"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowDown2, Award, Chart2, Messages2, People, Share, Wallet3 } from "iconsax-reactjs";
import { useState } from "react";
import { Reveal, RevealGroup, RevealItem } from "@/shared/animations/Reveal";
import { CountUp } from "@/shared/animations/CountUp";
import { ParallaxImage } from "@/shared/animations/MotionImage";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { cn } from "@/shared/lib/cn";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { ApplicationForm } from "./ApplicationForm";
import { CommissionSimulator } from "./CommissionSimulator";

const BENEFITS = [
  { icon: Wallet3, title: "Des commissions attractives", text: "De 5 à 10 % sur chaque vente, versées régulièrement et suivies dans votre espace." },
  { icon: Messages2, title: "Les clients viennent à vous", text: "Les commandes vous sont assignées et vous discutez directement avec l'acheteur." },
  { icon: Share, title: "Votre code, votre réseau", text: "Partagez votre code (ou QR) : chaque client invité reste rattaché à vous." },
  { icon: Chart2, title: "Un espace dédié", text: "Commandes, ventes, commissions et invités : tout est suivi en temps réel." },
  { icon: People, title: "Une équipe derrière vous", text: "Un responsable vous accompagne et le catalogue est toujours à jour." },
  { icon: Award, title: "Aucun stock à avancer", text: "Pas d'investissement : Celebobo fournit les produits, vous apportez les clients." },
];

const STEPS = [
  { title: "Candidatez", text: "Remplissez le formulaire en 2 minutes." },
  { title: "Validation", text: "Un responsable vous appelle et active votre compte revendeur." },
  { title: "Vendez & gagnez", text: "Recevez des commandes, vendez, touchez vos commissions." },
];

const FAQ = [
  { q: "Faut-il payer pour devenir revendeur ?", a: "Non. L'inscription est gratuite et sans engagement. Vous n'avancez aucun stock." },
  { q: "Comment sont calculées mes commissions ?", a: "Un pourcentage du prix de vente final, selon votre palier mensuel (5 %, 7 % ou 10 %). Le détail est visible dans votre espace revendeur." },
  { q: "Quand suis-je payé ?", a: "Les commissions dues sont réglées périodiquement par Mobile Money ou en cash. Chaque paiement apparaît dans votre historique." },
  { q: "Comment fonctionne le code d'invitation ?", a: "Vous recevez un code à 4 chiffres. Vos clients le saisissent à l'inscription ou dans leur profil : ils sont rattachés à vous." },
  { q: "Puis-je négocier le prix avec le client ?", a: "Oui : dans la discussion, vous pouvez proposer un prix final que le client accepte ou refuse." },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-line-3 rounded-box border border-line-3">
      {FAQ.map((f, i) => (
        <div key={f.q}>
          <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left text-[14px] font-bold leading-[20px] transition-colors hover:text-primary active:bg-chip sm:px-5 sm:py-4 sm:text-[15px]">
            {f.q}
            <ArrowDown2 size={16} className={cn("shrink-0 transition-transform duration-300", open === i && "rotate-180")} />
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} className="overflow-hidden">
                <p className="px-4 pb-4 text-[14px] leading-[22px] text-ink-2 sm:px-5 sm:pb-5">{f.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export function ResellerApplicationView() {
  return (
    <>
      <Breadcrumb items={[{ label: "Devenir revendeur" }]} />

      {/* Hero */}
      <Reveal>
        <section className="relative overflow-hidden rounded-box bg-ink-dark text-white">
          <ParallaxImage src="/images/about/team-1.jpg" alt="" fill sizes="1300px" strength={30} wrapperClassName="absolute inset-0 opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-dark via-ink-dark/80 to-transparent" />
          <div className="relative grid gap-6 px-4 py-9 sm:gap-8 sm:px-12 sm:py-14 lg:grid-cols-[1.2fr_1fr] lg:py-20">
            <div>
              <span className="inline-block rounded-full bg-primary px-3 py-1 text-[12px] font-bold uppercase tracking-wider">Programme revendeur</span>
              <h1 className="mt-4 text-[28px] font-extrabold leading-[34px] sm:mt-5 sm:text-[46px] sm:leading-[52px]">Vendez la tech.<br /><span className="text-sun">Gagnez à chaque vente.</span></h1>
              <p className="mt-3 max-w-[520px] text-[14px] leading-[22px] text-white/80 sm:mt-4 sm:text-[16px] sm:leading-[26px]">Rejoignez le réseau de revendeurs Celebobo : des commandes qui vous sont assignées, des commissions de 5 à 10 % et un espace pour tout suivre.</p>
              <div className="mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:gap-3">
                <Button href="#candidater" size="lg" className="max-sm:w-full">Candidater maintenant</Button>
                <Button href="#gains" variant="white" size="lg" className="max-sm:w-full">Estimer mes gains</Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 self-end text-center sm:gap-3">
              {[
                { n: 23, s: "", l: "revendeurs actifs" },
                { n: 10, s: " %", l: "commission max." },
                { n: 48, s: " h", l: "pour être activé" },
              ].map((x) => (
                <div key={x.l} className="rounded-box bg-white/10 p-2.5 backdrop-blur sm:p-4">
                  <p className="text-[22px] font-extrabold leading-[28px] text-primary-light sm:text-[28px] sm:leading-[34px]"><CountUp to={x.n} suffix={x.s} /></p>
                  <p className="mt-1 text-[11px] leading-[14px] text-white/70 sm:text-[12px]">{x.l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Avantages */}
      <Block pad="none" className="p-4 sm:p-[30px]">
        <h2 className="text-[16px] uppercase sm:text-section">Pourquoi nous rejoindre</h2>
        <RevealGroup className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <RevealItem key={title}>
              <div className="group flex h-full gap-3.5 rounded-box border border-line-3 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 sm:block sm:p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-100 text-primary-dark transition-all duration-500 group-hover:rotate-[360deg] group-hover:bg-primary group-hover:text-white sm:size-12"><Icon size={22} variant="Bold" /></span>
                <div className="min-w-0">
                  <h3 className="text-[15px] leading-[21px] sm:mt-4 sm:text-[16px] sm:leading-[22px]">{title}</h3>
                  <p className="mt-1 text-[13px] leading-[19px] text-ink-2 sm:mt-1.5 sm:text-[14px] sm:leading-[21px]">{text}</p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Block>

      {/* Commission + étapes */}
      <div id="gains" className="grid scroll-mt-6 gap-3 sm:gap-4 lg:grid-cols-2">
        <Reveal direction="up" className="min-w-0"><CommissionSimulator /></Reveal>
        <Reveal direction="up" className="min-w-0">
          <Block pad="none" className="h-full p-4 sm:p-[30px]">
            <h2 className="text-[16px] uppercase sm:text-section">Comment ça marche</h2>
            <ol className="relative mt-5 space-y-6 sm:mt-6 sm:space-y-8">
              <span aria-hidden className="absolute bottom-4 left-[19px] top-4 w-[2px] bg-line-3" />
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative flex gap-4">
                  <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-primary text-[16px] font-bold text-white">{i + 1}</span>
                  <p className="pt-1"><strong className="block text-[16px]">{s.title}</strong><span className="text-[14px] text-ink-2">{s.text}</span></p>
                </li>
              ))}
            </ol>
          </Block>
        </Reveal>
      </div>

      {/* Candidature */}
      <div id="candidater" className="grid scroll-mt-6 gap-3 sm:gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Reveal className="min-w-0">
          <Block pad="none" className="p-4 sm:p-[30px]">
            <h2 className="text-[22px] leading-[28px] sm:text-h-page">Déposez votre candidature</h2>
            <p className="mb-4 mt-1 text-[13px] text-ink-2 sm:mb-6 sm:text-[14px]">Réponse sous 48 h.</p>
            <ApplicationForm />
          </Block>
        </Reveal>
        <Reveal delay={0.1} className="min-w-0">
          <Block pad="none" className="p-4 sm:p-[30px]">
            <h2 className="mb-4 text-[16px] uppercase sm:mb-5 sm:text-section">Questions fréquentes</h2>
            <Faq />
          </Block>
        </Reveal>
      </div>
    </>
  );
}
