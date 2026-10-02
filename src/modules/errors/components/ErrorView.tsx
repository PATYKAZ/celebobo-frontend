"use client";

import { motion } from "motion/react";
import { Danger, Refresh2 } from "iconsax-reactjs";
import { useEffect } from "react";
import { ROUTES } from "@/config/routes";
import { Logo } from "@/shared/layout/Logo";
import { Button } from "@/shared/ui/Button";

export function ErrorView({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-screen flex-col py-4">
      <header className="rounded-box bg-white px-4 py-3 sm:px-[30px] sm:py-4"><Logo /></header>
      <main className="mt-3 grid flex-1 place-items-center rounded-box bg-white px-4 py-10 text-center sm:mt-4 sm:py-16">
        <div>
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -10, 10, -6, 0] }} transition={{ scale: { type: "spring", stiffness: 260, damping: 12 }, rotate: { duration: 0.7, ease: "easeInOut" } }} className="mx-auto grid size-20 place-items-center rounded-full bg-danger-100 text-danger sm:size-24">
            <Danger size={46} variant="Bold" />
          </motion.span>
          <h1 className="mt-5 text-[22px] leading-[28px] sm:mt-6 sm:text-[28px] sm:leading-[34px]">Une erreur est survenue</h1>
          <p className="mx-auto mt-2 max-w-[440px] text-[14px] leading-[22px] text-ink-2 sm:mt-3 sm:text-[15px] sm:leading-[24px]">Quelque chose s&apos;est mal passé de notre côté. Vous pouvez réessayer ou revenir à l&apos;accueil.</p>
          {error.digest && <p className="mt-2 text-[12px] text-ink-3">Référence : {error.digest}</p>}
          <div className="mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
            <Button size="lg" onClick={reset} leftIcon={<Refresh2 size={18} />} className="max-sm:w-full">Réessayer</Button>
            <Button href={ROUTES.home} size="lg" variant="chip" className="max-sm:w-full">Accueil</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
