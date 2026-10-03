"use client";

import Image from "next/image";
import { ShieldTick } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { CountUp } from "@/shared/animations/CountUp";
import { Float, ParallaxImage, TiltCard } from "@/shared/animations/MotionImage";
import { Reveal, RevealGroup, RevealItem } from "@/shared/animations/Reveal";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { markdownSections, plainText, usePage } from "@/modules/pages";
import { MISSION, STATS, STORY, VALUES } from "../content";

/** Histoire (1ʳᵉ section avec paragraphe) et engagements (1ʳᵉ liste) de la page `a-propos`, sinon textes par défaut. */
function aboutContent(body?: string) {
  const sections = body ? markdownSections(body) : [];
  const story = sections.find((s) => s.blocks.some((b) => b.type === "paragraph"));
  const paragraph = story?.blocks.find((b) => b.type === "paragraph");
  const list = sections.flatMap((s) => s.blocks).find((b) => b.type === "list");
  return {
    badge: story?.heading ?? STORY.badge,
    story: paragraph?.type === "paragraph" ? plainText(paragraph.text) : STORY.text,
    points: list?.type === "list" ? list.items.map(plainText) : MISSION.points,
  };
}

export function AboutView() {
  const { data: page } = usePage("a-propos");
  const content = aboutContent(page?.body);

  return (
    <>
      <Breadcrumb items={[{ label: "À propos" }]} />

      {/* Hero */}
      <Block pad="none" className="relative overflow-hidden">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="p-4 pt-6 sm:p-10 lg:p-[60px]">
            <Reveal><span className="inline-block rounded-full bg-primary-50 px-4 py-1.5 text-[12px] font-bold uppercase tracking-wider text-primary">{content.badge}</span></Reveal>
            <Reveal delay={0.08}><h1 className="mt-4 text-[28px] font-extrabold leading-[34px] sm:mt-5 sm:text-[44px] sm:leading-[52px]">La technologie, <span className="text-primary">simplement</span> et en confiance.</h1></Reveal>
            <Reveal delay={0.16}><p className="mt-4 max-w-[520px] text-[14px] leading-[23px] text-ink-2 sm:mt-5 sm:text-[15px] sm:leading-[26px]">{content.story}</p></Reveal>
            <Reveal delay={0.24} className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
              <Button href={ROUTES.products} size="lg" className="max-sm:w-full">Découvrir la boutique</Button>
              <Button href={ROUTES.contact} size="lg" variant="outline" className="max-sm:w-full">Nous contacter</Button>
            </Reveal>
          </div>
          <div className="relative h-[220px] sm:h-[320px] lg:h-[520px]">
            <ParallaxImage src="/images/about/team-1.jpg" alt="L'équipe Celebobo au travail" fill sizes="(min-width:1024px) 650px, 100vw" priority wrapperClassName="absolute inset-0" />
            <Float slow className="absolute bottom-6 left-6 hidden sm:block">
              <div className="rounded-box bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,.15)]">
                <p className="text-[28px] font-extrabold leading-none text-primary"><CountUp to={4.9} decimals={1} /></p>
                <p className="mt-1 text-[12px] text-ink-2">Note moyenne clients</p>
              </div>
            </Float>
          </div>
        </div>
      </Block>

      {/* Stats */}
      <RevealGroup className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {STATS.map(({ value, suffix, label, icon: Icon }) => (
          <RevealItem key={label} className="min-w-0">
            <TiltCard className="h-full rounded-box bg-white p-4 text-center sm:p-7">
              <span className="mx-auto grid size-11 place-items-center rounded-full bg-primary-100 text-primary-dark sm:size-14"><Icon size={22} variant="Bold" /></span>
              <p className="mt-3 text-[26px] font-extrabold leading-[32px] sm:mt-4 sm:text-[34px] sm:leading-[40px]"><CountUp to={value} suffix={suffix} /></p>
              <p className="mt-1 text-[12px] leading-[16px] text-ink-2 sm:text-[13px]">{label}</p>
            </TiltCard>
          </RevealItem>
        ))}
      </RevealGroup>

      {/* Mission */}
      <Block pad="none" className="p-4 sm:p-[30px]">
        <div className="grid items-center gap-6 sm:gap-10 lg:grid-cols-[1fr_1.1fr]">
          <Reveal direction="up">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-box"><Image src="/images/about/store.jpg" alt="Notre espace de vente" fill sizes="300px" className="object-cover transition-transform duration-700 hover:scale-110" /></div>
              <div className="relative mt-6 aspect-[3/4] sm:mt-10 overflow-hidden rounded-box"><Image src="/images/about/team-2.jpg" alt="Réunion d'équipe" fill sizes="300px" className="object-cover transition-transform duration-700 hover:scale-110" /></div>
            </div>
          </Reveal>
          <Reveal direction="up">
            <h2 className="text-[22px] leading-[28px] sm:text-[28px] sm:leading-[34px]">{MISSION.title}</h2>
            <p className="mt-3 text-[14px] leading-[23px] text-ink-2 sm:mt-4 sm:text-[15px] sm:leading-[26px]">{MISSION.text}</p>
            <ul className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
              {content.points.map((t) => (
                <li key={t} className="flex items-center gap-3 text-[14px] font-semibold"><span className="grid size-6 place-items-center rounded-full bg-primary text-white"><ShieldTick size={14} variant="Bold" /></span>{t}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Block>

      {/* Valeurs */}
      <Block pad="none" className="p-4 sm:p-[30px]">
        <Reveal><h2 className="text-center text-[16px] uppercase sm:text-section">Nos valeurs</h2></Reveal>
        <RevealGroup className="mt-5 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <RevealItem key={title}>
              <div className="group flex h-full gap-3.5 rounded-box border border-line-3 p-4 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary hover:bg-primary-50 sm:block sm:p-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-chip transition-colors duration-300 group-hover:bg-primary group-hover:text-white sm:size-12"><Icon size={22} variant="Bold" /></span>
                <div className="min-w-0">
                  <h3 className="text-[16px] sm:mt-4 sm:text-[18px]">{title}</h3>
                  <p className="mt-1 text-[13px] leading-[19px] text-ink-2 sm:mt-2 sm:text-[14px] sm:leading-[22px]">{text}</p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Block>

      {/* CTA */}
      <Reveal>
        <div className="relative overflow-hidden rounded-box bg-primary px-4 py-9 text-center text-white sm:px-6 sm:py-16">
          <span aria-hidden className="absolute -left-10 -top-10 size-48 rounded-full bg-white/10" />
          <span aria-hidden className="absolute -bottom-16 right-10 size-64 rounded-full bg-white/10" />
          <h2 className="relative text-[22px] leading-[28px] sm:text-[34px] sm:leading-[40px]">Prêt à faire votre première commande ?</h2>
          <p className="relative mx-auto mt-3 max-w-[520px] text-[15px] text-white/85">Rejoignez des milliers de clients qui font confiance à Celebobo.</p>
          <div className="relative mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
            <Button href={ROUTES.products} variant="white" size="lg" className="max-sm:w-full">Voir les produits</Button>
            <Button href={ROUTES.register} variant="dark" size="lg" className="max-sm:w-full">Créer un compte</Button>
          </div>
        </div>
      </Reveal>
    </>
  );
}
