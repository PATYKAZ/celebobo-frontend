"use client";

import Image from "next/image";
import { ShieldTick } from "@/shared/ui/icons";
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
          <div className="p-4 pt-6 sm:p-6 lg:p-8">
            <Reveal><h1 className="text-2xl font-bold">La technologie, <span className="text-primary">simplement</span> et en confiance.</h1></Reveal>
            <Reveal delay={0.16}><p className="mt-4 max-w-[520px] text-sm text-ink-2 sm:mt-5 sm:text-sm">{content.story}</p></Reveal>
            <Reveal delay={0.24} className="mt-6 flex flex-col gap-2.5 sm:mt-5 sm:flex-row sm:flex-wrap sm:gap-3">
              <Button href={ROUTES.products} size="lg" className="max-sm:w-full">Découvrir la boutique</Button>
              <Button href={ROUTES.contact} size="lg" variant="secondary" className="max-sm:w-full">Nous contacter</Button>
            </Reveal>
          </div>
          <div className="relative h-[220px] sm:h-[320px] lg:h-[520px]">
            <ParallaxImage src="/images/about/team-1.jpg" alt="L'équipe Celebobo au travail" fill sizes="(min-width:1024px) 650px, 100vw" priority wrapperClassName="absolute inset-0" />
            <Float slow className="absolute bottom-6 left-6 hidden sm:block">
              <div className="rounded-box bg-surface p-4 shadow-lg">
                <p className="text-2xl font-bold leading-none text-primary"><CountUp to={4.9} decimals={1} /></p>
                <p className="mt-1 text-xs text-ink-2">Note moyenne clients</p>
              </div>
            </Float>
          </div>
        </div>
      </Block>

      {/* Stats */}
      <RevealGroup className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {STATS.map(({ value, suffix, label, icon: Icon }) => (
          <RevealItem key={label} className="min-w-0">
            <TiltCard className="h-full rounded-box bg-surface p-4 text-center sm:p-7">
              <span className="mx-auto grid size-11 place-items-center rounded-full bg-primary-100 text-primary-dark sm:size-14"><Icon size={22} variant="Bold" /></span>
              <p className="mt-3 text-xl font-bold sm:mt-4 sm:text-2xl"><CountUp to={value} suffix={suffix} /></p>
              <p className="mt-1 text-xs text-ink-2 sm:text-sm">{label}</p>
            </TiltCard>
          </RevealItem>
        ))}
      </RevealGroup>

      {/* Mission */}
      <Block pad="none" className="p-4 sm:p-5">
        <div className="grid items-center gap-6 sm:gap-10 lg:grid-cols-[1fr_1.1fr]">
          <Reveal direction="up">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
              <div className="relative aspect-3/4 overflow-hidden rounded-box"><Image src="/images/about/store.jpg" alt="Notre espace de vente" fill sizes="300px" className="object-cover transition-transform duration-500 hover:scale-110" /></div>
              <div className="relative mt-6 aspect-3/4 sm:mt-10 overflow-hidden rounded-box"><Image src="/images/about/team-2.jpg" alt="Réunion d'équipe" fill sizes="300px" className="object-cover transition-transform duration-500 hover:scale-110" /></div>
            </div>
          </Reveal>
          <Reveal direction="up">
            <h2 className="text-xl sm:text-2xl">{MISSION.title}</h2>
            <p className="mt-3 text-sm text-ink-2 sm:mt-4 sm:text-sm">{MISSION.text}</p>
            <ul className="mt-5 space-y-2.5 sm:mt-4 sm:space-y-3">
              {content.points.map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm font-semibold"><span className="grid size-6 place-items-center rounded-full bg-primary text-white"><ShieldTick size={14} variant="Bold" /></span>{t}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Block>

      {/* Valeurs */}
      <Block pad="none" className="p-4 sm:p-5">
        <Reveal><h2 className="text-base sm:text-section">Nos valeurs</h2></Reveal>
        <RevealGroup className="mt-5 grid gap-x-10 gap-y-6 sm:mt-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <RevealItem key={title}>
              <div className="flex h-full gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-100 text-primary-dark"><Icon size={22} variant="Bold" /></span>
                <div className="min-w-0">
                  <h3 className="text-base">{title}</h3>
                  <p className="mt-1 text-sm text-ink-2">{text}</p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Block>

      {/* CTA */}
      <Reveal>
        <div className="relative overflow-hidden rounded-box bg-primary px-4 py-9 text-center text-white sm:px-6 sm:py-16">
          <h2 className="relative text-xl sm:text-2xl">Prêt à faire votre première commande ?</h2>
          <p className="relative mx-auto mt-3 max-w-[520px] text-sm text-white/85">Rejoignez des milliers de clients qui font confiance à Celebobo.</p>
          <div className="relative mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
            <Button href={ROUTES.products} variant="secondary" size="lg" className="max-sm:w-full">Voir les produits</Button>
            <Button href={ROUTES.register} variant="secondary" size="lg" className="max-sm:w-full">Créer un compte</Button>
          </div>
        </div>
      </Reveal>
    </>
  );
}
