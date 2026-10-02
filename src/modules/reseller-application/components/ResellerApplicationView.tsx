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
          <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-bold transition-colors hover:text-primary">
            {f.q}
            <ArrowDown2 size={16} className={cn("shrink-0 transition-transform duration-300", open === i && "rotate-180")} />
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} className="overflow-hidden">
                <p className="px-5 pb-5 text-[14px] leading-[22px] text-ink-2">{f.a}</p>
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
          <div className="relative grid gap-8 px-6 py-14 sm:px-12 lg:grid-cols-[1.2fr_1fr] lg:py-20">
            <div>
              <span className="inline-block rounded-full bg-primary px-3 py-1 text-[12px] font-bold uppercase tracking-wider">Programme revendeur</span>
              <h1 className="mt-5 text-[34px] font-extrabold leading-[40px] sm:text-[46px] sm:leading-[52px]">Vendez la tech.<br /><span className="text-sun">Gagnez à chaque vente.</span></h1>
              <p className="mt-4 max-w-[520px] text-[16px] leading-[26px] text-white/80">Rejoignez le réseau de revendeurs Celebobo : des commandes qui vous sont assignées, des commissions de 5 à 10 % et un espace pour tout suivre.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button href="#candidater" size="lg">Candidater maintenant</Button>
                <Button href="#gains" variant="white" size="lg">Estimer mes gains</Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 self-end text-center">
              {[
                { n: 23, s: "", l: "revendeurs actifs" },
                { n: 10, s: " %", l: "commission max." },
                { n: 48, s: " h", l: "pour être activé" },
              ].map((x) => (
                <div key={x.l} className="rounded-box bg-white/10 p-4 backdrop-blur">
                  <p className="text-[28px] font-extrabold leading-[34px] text-primary-light"><CountUp to={x.n} suffix={x.s} /></p>
                  <p className="mt-1 text-[12px] text-white/70">{x.l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Avantages */}
      <Block>
        <h2 className="text-section uppercase">Pourquoi nous rejoindre</h2>
        <RevealGroup className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <RevealItem key={title}>
              <div className="group h-full rounded-box border border-line-3 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50">
                <span className="grid size-12 place-items-center rounded-full bg-primary-100 text-primary-dark transition-all duration-500 group-hover:rotate-[360deg] group-hover:bg-primary group-hover:text-white"><Icon size={24} variant="Bold" /></span>
                <h3 className="mt-4 text-[16px] leading-[22px]">{title}</h3>
                <p className="mt-1.5 text-[14px] leading-[21px] text-ink-2">{text}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Block>

      {/* Commission + étapes */}
      <div id="gains" className="grid scroll-mt-6 gap-4 lg:grid-cols-2">
        <Reveal direction="right"><CommissionSimulator /></Reveal>
        <Reveal direction="left">
          <Block className="h-full">
            <h2 className="text-section uppercase">Comment ça marche</h2>
            <ol className="relative mt-6 space-y-8">
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
      <div id="candidater" className="grid scroll-mt-6 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Reveal>
          <Block>
            <h2 className="text-h-page">Déposez votre candidature</h2>
            <p className="mb-6 mt-1 text-[14px] text-ink-2">Réponse sous 48 h.</p>
            <ApplicationForm />
          </Block>
        </Reveal>
        <Reveal delay={0.1}>
          <Block>
            <h2 className="mb-5 text-section uppercase">Questions fréquentes</h2>
            <Faq />
          </Block>
        </Reveal>
      </div>
    </>
  );
}
