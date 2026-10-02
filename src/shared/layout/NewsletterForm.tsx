"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Sms, TickCircle } from "iconsax-reactjs";
import { useState, type FormEvent } from "react";
import { getErrorMessage } from "@/shared/lib/api";
import { useNewsletterSubscribe } from "@/modules/newsletter/hooks/useNewsletter";

/** Inscription newsletter branchée sur le service (état de succès inline, doublons gérés). */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const subscribe = useNewsletterSubscribe();
  const done = subscribe.data;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Adresse e-mail invalide.");
    subscribe.mutate(email, { onError: (err) => setError(getErrorMessage(err)) });
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {done ? (
        <motion.div key="ok" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-3 rounded-box bg-primary-50 p-4" role="status">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-white"><TickCircle size={20} variant="Bold" /></span>
          <p className="text-[14px] leading-[21px]">
            <strong className="block">{done.alreadySubscribed ? "Vous êtes déjà abonné(e) !" : "Merci, vous êtes abonné(e) !"}</strong>
            <span className="text-ink-2">
              {done.alreadySubscribed ? "Cette adresse reçoit déjà nos nouveautés." : <>Votre code <strong className="tracking-wider text-primary">{done.discountCode}</strong> (−10 %) a été envoyé à {done.email}.</>}
            </span>
          </p>
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="flex h-[41px] items-center gap-2 border-b border-line">
            <Sms size={20} variant="Bold" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="Entrez votre adresse e-mail"
              aria-label="Adresse e-mail"
              aria-invalid={!!error}
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink-4"
            />
            <button disabled={subscribe.isPending} className="group flex items-center gap-2 text-[14px] font-bold uppercase text-primary disabled:opacity-50">
              {subscribe.isPending ? "…" : "S'abonner"}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
          {error && <p role="alert" className="mt-1.5 text-[12px] text-danger">{error}</p>}
        </motion.form>
      )}
    </AnimatePresence>
  );
}
