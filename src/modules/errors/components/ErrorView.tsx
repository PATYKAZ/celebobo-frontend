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
      <header className="rounded-box bg-white px-5 py-4 sm:px-[30px]"><Logo /></header>
      <main className="mt-4 grid flex-1 place-items-center rounded-box bg-white px-4 py-16 text-center">
        <div>
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -10, 10, -6, 0] }} transition={{ scale: { type: "spring", stiffness: 260, damping: 12 }, rotate: { duration: 0.7, ease: "easeInOut" } }} className="mx-auto grid size-24 place-items-center rounded-full bg-danger-100 text-danger">
            <Danger size={46} variant="Bold" />
          </motion.span>
          <h1 className="mt-6 text-[28px] leading-[34px]">Une erreur est survenue</h1>
          <p className="mx-auto mt-3 max-w-[440px] text-[15px] leading-[24px] text-ink-2">Quelque chose s&apos;est mal passé de notre côté. Vous pouvez réessayer ou revenir à l&apos;accueil.</p>
          {error.digest && <p className="mt-2 text-[12px] text-ink-3">Référence : {error.digest}</p>}
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={reset} leftIcon={<Refresh2 size={18} />}>Réessayer</Button>
            <Button href={ROUTES.home} size="lg" variant="chip">Accueil</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
