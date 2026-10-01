"use client";

import { AnimatePresence, motion } from "motion/react";
import { Call, Clock, Location, Sms, TickCircle, Whatsapp } from "iconsax-reactjs";
import { SITE } from "@/config/site";
import { Reveal, RevealGroup, RevealItem } from "@/shared/animations/Reveal";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Input, Select, Textarea } from "@/shared/ui/Form";
import { useContactForm } from "../hooks/useContactForm";
import { CONTACT_SUBJECTS } from "../types";
import { ContactMap } from "./ContactMap";

const CARDS = [
  { icon: Call, title: "Hotline 24/7", value: SITE.hotline, href: SITE.hotlineHref },
  { icon: Sms, title: "E-mail", value: SITE.email, href: `mailto:${SITE.email}` },
  { icon: Whatsapp, title: "WhatsApp", value: "Discuter maintenant", href: SITE.social.whatsapp },
  { icon: Location, title: "Adresse", value: `${SITE.address[0]}, ${SITE.address[1]}`, href: "#plan" },
];

const HOURS = [
  ["Lundi – Vendredi", "08h00 – 19h00"],
  ["Samedi", "09h00 – 17h00"],
  ["Dimanche", "Support en ligne uniquement"],
];

export function ContactView() {
  const { values, errors, sent, loading, onChange, onSubmit, reset } = useContactForm();

  return (
    <>
      <Breadcrumb items={[{ label: "Contact" }]} />

      <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map(({ icon: Icon, title, value, href }) => (
          <RevealItem key={title}>
            <a href={href} className="group flex h-full items-center gap-4 rounded-box bg-white p-5 transition-transform duration-300 hover:-translate-y-1.5">
              <span className="grid size-[52px] shrink-0 place-items-center rounded-full bg-primary-100 text-primary-dark transition-all duration-300 group-hover:rotate-[360deg] group-hover:bg-primary group-hover:text-white"><Icon size={24} variant="Bold" /></span>
              <span className="min-w-0">
                <span className="block text-[12px] uppercase tracking-wide text-ink-3">{title}</span>
                <span className="block break-words text-[14px] font-bold leading-[20px]">{value}</span>
              </span>
            </a>
          </RevealItem>
        ))}
      </RevealGroup>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Reveal direction="right">
          <Block className="h-full">
            <h1 className="text-h-page">Écrivez-nous</h1>
            <p className="mt-1 text-[14px] text-ink-2">Une question ? Notre équipe vous répond sous 24 h.</p>

            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-14 text-center">
                  <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 12 }} className="grid size-20 place-items-center rounded-full bg-primary text-white"><TickCircle size={42} variant="Bold" /></motion.span>
                  <h2 className="mt-5 text-[22px]">Message envoyé !</h2>
                  <p className="mt-2 max-w-[360px] text-[14px] text-ink-2">Merci de nous avoir contactés, nous revenons vers vous très rapidement.</p>
                  <Button className="mt-6" variant="chip" upper={false} onClick={reset}>Envoyer un autre message</Button>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={onSubmit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Input name="name" label="Nom complet" required value={values.name} onChange={onChange} error={errors.name} placeholder="Aline Mbuyi" autoComplete="name" />
                  <Input name="email" type="email" label="E-mail" required value={values.email} onChange={onChange} error={errors.email} placeholder="vous@exemple.com" autoComplete="email" />
                  <Input name="phone" type="tel" label="Téléphone" value={values.phone} onChange={onChange} error={errors.phone} placeholder="+243 …" autoComplete="tel" />
                  <Select name="subject" label="Sujet" value={values.subject} onChange={onChange} options={CONTACT_SUBJECTS} />
                  <Textarea name="message" label="Message" required value={values.message} onChange={onChange} error={errors.message} placeholder="Comment pouvons-nous vous aider ?" wrapperClassName="sm:col-span-2" rows={6} />
                  <div className="sm:col-span-2">
                    <Button type="submit" size="lg" loading={loading}>Envoyer le message</Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </Block>
        </Reveal>

        <Reveal direction="left">
          <Block className="h-full">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-chip"><Clock size={22} variant="Bold" /></span>
              <h2 className="text-section uppercase">Horaires d&apos;ouverture</h2>
            </div>
            <ul className="mt-6 divide-y divide-line-3">
              {HOURS.map(([d, h]) => (
                <li key={d} className="flex items-center justify-between gap-4 py-3.5 text-[14px]"><span className="font-semibold">{d}</span><span className="text-right text-ink-2">{h}</span></li>
              ))}
            </ul>
            <div className="mt-6 rounded-box bg-primary-50 p-5">
              <p className="text-[12px] uppercase text-ink-2">Urgence ? Appelez-nous</p>
              <a href={SITE.hotlineHref} className="mt-1 block text-[26px] font-bold leading-[32px] text-primary">{SITE.hotline}</a>
            </div>
          </Block>
        </Reveal>
      </div>

      <Reveal><div id="plan"><ContactMap /></div></Reveal>
    </>
  );
}
