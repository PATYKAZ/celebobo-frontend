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
import { formatDateTime } from "@/shared/lib/format";
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
  const { values, errors, sent, receipt, loading, onChange, onSubmit, reset } = useContactForm();

  return (
    <>
      <Breadcrumb items={[{ label: "Contact" }]} />

      <RevealGroup className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {CARDS.map(({ icon: Icon, title, value, href }) => (
          <RevealItem key={title} className="min-w-0">
            <a href={href} className="group flex h-full flex-col items-start gap-2.5 rounded-box bg-white p-4 transition-transform duration-300 active:scale-[0.98] sm:flex-row sm:items-center sm:gap-4 sm:p-5 sm:hover:-translate-y-1.5">
              <span className="grid size-11 shrink-0 sm:size-[52px] place-items-center rounded-full bg-primary-100 text-primary-dark transition-all duration-300 group-hover:rotate-[360deg] group-hover:bg-primary group-hover:text-white"><Icon size={24} variant="Bold" /></span>
              <span className="min-w-0">
                <span className="block text-[12px] uppercase tracking-wide text-ink-3">{title}</span>
                <span className="block break-words text-[13px] font-bold leading-[18px] sm:text-[14px] sm:leading-[20px]">{value}</span>
              </span>
            </a>
          </RevealItem>
        ))}
      </RevealGroup>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Reveal direction="up" className="min-w-0">
          <Block pad="none" className="h-full p-4 sm:p-[30px]">
            <h1 className="text-[22px] leading-[28px] sm:text-h-page">Écrivez-nous</h1>
            <p className="mt-1 text-[13px] text-ink-2 sm:text-[14px]">Une question ? Notre équipe vous répond sous 24 h.</p>

            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-8 text-center sm:py-14">
                  <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 12 }} className="grid size-20 place-items-center rounded-full bg-primary text-white"><TickCircle size={42} variant="Bold" /></motion.span>
                  <h2 className="mt-5 text-[22px]">Message envoyé !</h2>
                  <p className="mt-2 max-w-[400px] text-[14px] text-ink-2">Merci de nous avoir contactés, nous revenons vers vous sous 24 h à l&apos;adresse <strong className="text-ink">{receipt?.input.email}</strong>.</p>
                  {receipt && (
                    <dl className="mt-6 w-full max-w-[400px] divide-y divide-line-3 rounded-box bg-page/60 text-left text-[13px]">
                      <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-ink-3">Référence</dt><dd className="font-bold tracking-wide text-primary">{receipt.reference}</dd></div>
                      <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-ink-3">Sujet</dt><dd className="font-semibold">{CONTACT_SUBJECTS.find((s) => s.value === receipt.input.subject)?.label ?? receipt.input.subject}</dd></div>
                      <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-ink-3">Envoyé le</dt><dd className="font-semibold">{formatDateTime(receipt.sentAt)}</dd></div>
                      <div className="px-4 py-3"><dt className="text-ink-3">Votre message</dt><dd className="mt-1 line-clamp-3 italic text-ink-2">« {receipt.input.message} »</dd></div>
                    </dl>
                  )}
                  <Button className="mt-6" variant="chip" upper={false} onClick={reset}>Envoyer un autre message</Button>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={onSubmit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 grid gap-4 sm:mt-6 sm:grid-cols-2">
                  <Input name="name" label="Nom complet" required value={values.name} onChange={onChange} error={errors.name} placeholder="Aline Mbuyi" autoComplete="name" />
                  <Input name="email" type="email" label="E-mail" required value={values.email} onChange={onChange} error={errors.email} placeholder="vous@exemple.com" autoComplete="email" inputMode="email" autoCapitalize="none" enterKeyHint="next" />
                  <Input name="phone" type="tel" label="Téléphone" value={values.phone} onChange={onChange} error={errors.phone} placeholder="+243 …" autoComplete="tel" inputMode="tel" enterKeyHint="next" />
                  <Select name="subject" label="Sujet" value={values.subject} onChange={onChange} options={CONTACT_SUBJECTS} />
                  <Textarea name="message" label="Message" required value={values.message} onChange={onChange} error={errors.message} placeholder="Comment pouvons-nous vous aider ?" wrapperClassName="sm:col-span-2" rows={6} />
                  <div className="sm:col-span-2">
                    <Button type="submit" size="lg" loading={loading} className="max-sm:w-full">Envoyer le message</Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </Block>
        </Reveal>

        <Reveal direction="up" className="min-w-0">
          <Block pad="none" className="h-full p-4 sm:p-[30px]">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-chip"><Clock size={22} variant="Bold" /></span>
              <h2 className="text-[16px] uppercase sm:text-section">Horaires d&apos;ouverture</h2>
            </div>
            <ul className="mt-4 divide-y divide-line-3 sm:mt-6">
              {HOURS.map(([d, h]) => (
                <li key={d} className="flex items-start justify-between gap-3 py-3 text-[13px] sm:items-center sm:gap-4 sm:py-3.5 sm:text-[14px]"><span className="font-semibold">{d}</span><span className="text-right text-ink-2">{h}</span></li>
              ))}
            </ul>
            <div className="mt-4 rounded-box bg-primary-50 p-4 sm:mt-6 sm:p-5">
              <p className="text-[12px] uppercase text-ink-2">Urgence ? Appelez-nous</p>
              <a href={SITE.hotlineHref} className="mt-1 flex min-h-11 items-center text-[24px] font-bold leading-[30px] text-primary sm:text-[26px] sm:leading-[32px]">{SITE.hotline}</a>
            </div>
          </Block>
        </Reveal>
      </div>

      <Reveal><div id="plan"><ContactMap /></div></Reveal>
    </>
  );
}
