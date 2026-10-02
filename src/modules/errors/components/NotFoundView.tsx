"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { SearchNormal1 } from "iconsax-reactjs";
import { useState, type FormEvent } from "react";
import { ROUTES } from "@/config/routes";
import { Float } from "@/shared/animations/MotionImage";
import { Logo } from "@/shared/layout/Logo";
import { Button } from "@/shared/ui/Button";

/** Page 404 autonome (rendue hors ShopShell) : gros « 404 » animé, produit flottant, recherche. */
export function NotFoundView() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.push(ROUTES.search(q.trim()));
  };

  return (
    <div className="container flex min-h-screen flex-col py-4">
      <header className="rounded-box bg-white px-4 py-3 sm:px-[30px] sm:py-4"><Logo /></header>
      <main className="mt-3 flex flex-1 items-center justify-center overflow-hidden rounded-box bg-white px-4 py-8 sm:mt-4 sm:py-14">
        <div className="grid w-full max-w-[980px] items-center gap-6 sm:gap-10 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <div className="flex items-end justify-center gap-1 text-[96px] font-extrabold leading-[88px] tracking-tighter sm:text-[160px] sm:leading-[140px] lg:justify-start">
              {["4", "0", "4"].map((c, i) => (
                <motion.span key={i} initial={{ y: 70, opacity: 0, rotate: -8 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 180, damping: 12, delay: i * 0.12 }} className={i === 1 ? "text-primary" : ""}>{c}</motion.span>
              ))}
            </div>
            <h1 className="mt-4 text-[22px] leading-[28px] sm:mt-6 sm:text-[26px] sm:leading-[32px]">Oups, cette page est introuvable</h1>
            <p className="mx-auto mt-2 max-w-[420px] text-[14px] leading-[22px] text-ink-2 sm:mt-3 sm:text-[15px] sm:leading-[24px] lg:mx-0">Le lien est peut-être cassé ou la page a été déplacée. Essayez une recherche ou retournez à l&apos;accueil.</p>
            <form onSubmit={submit} role="search" className="mx-auto mt-6 flex max-w-[440px] overflow-hidden rounded-pill border border-line focus-within:border-primary lg:mx-0">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un produit…" aria-label="Rechercher" enterKeyHint="search" className="h-12 min-w-0 flex-1 bg-white px-4 text-[16px] outline-none sm:h-auto sm:text-[14px]" />
              <button aria-label="Rechercher" className="grid w-14 place-items-center bg-primary text-white transition-colors hover:bg-primary-dark"><SearchNormal1 size={18} variant="Bold" /></button>
            </form>
            <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3 lg:justify-start">
              <Button href={ROUTES.home} size="lg" className="max-sm:w-full">Retour à l&apos;accueil</Button>
              <Button href={ROUTES.products} size="lg" variant="outline" className="max-sm:w-full">Voir la boutique</Button>
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[240px] sm:max-w-[420px]">
            <span aria-hidden className="absolute inset-4 animate-pulse-ring rounded-full bg-primary/15" />
            <span aria-hidden className="absolute inset-0 rounded-full bg-primary-50" />
            <Float slow className="absolute inset-8">
              <div className="relative size-full overflow-hidden rounded-[40px] rotate-[6deg]">
                <Image src="/images/products/phone-dark.jpg" alt="" fill sizes="360px" className="object-cover" priority />
              </div>
            </Float>
            <Float className="absolute -left-2 top-10 hidden sm:block">
              <div className="relative size-24 overflow-hidden rounded-box ring-4 ring-white"><Image src="/images/products/earbuds.jpg" alt="" fill sizes="96px" className="object-cover" /></div>
            </Float>
          </div>
        </div>
      </main>
    </div>
  );
}
