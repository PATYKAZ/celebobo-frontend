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
      <header className="rounded-box bg-white px-5 py-4 sm:px-[30px]"><Logo /></header>
      <main className="mt-4 flex flex-1 items-center justify-center overflow-hidden rounded-box bg-white px-4 py-14">
        <div className="grid w-full max-w-[980px] items-center gap-10 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <div className="flex items-end justify-center gap-1 text-[110px] font-extrabold leading-[100px] tracking-tighter sm:text-[160px] sm:leading-[140px] lg:justify-start">
              {["4", "0", "4"].map((c, i) => (
                <motion.span key={i} initial={{ y: 70, opacity: 0, rotate: -8 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 180, damping: 12, delay: i * 0.12 }} className={i === 1 ? "text-primary" : ""}>{c}</motion.span>
              ))}
            </div>
            <h1 className="mt-6 text-[26px] leading-[32px]">Oups, cette page est introuvable</h1>
            <p className="mx-auto mt-3 max-w-[420px] text-[15px] leading-[24px] text-ink-2 lg:mx-0">Le lien est peut-être cassé ou la page a été déplacée. Essayez une recherche ou retournez à l&apos;accueil.</p>
            <form onSubmit={submit} role="search" className="mx-auto mt-6 flex max-w-[440px] overflow-hidden rounded-pill border border-line focus-within:border-primary lg:mx-0">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un produit…" aria-label="Rechercher" className="min-w-0 flex-1 bg-white px-4 text-[14px] outline-none" />
              <button aria-label="Rechercher" className="grid w-12 place-items-center bg-primary text-white transition-colors hover:bg-primary-dark"><SearchNormal1 size={18} variant="Bold" /></button>
            </form>
            <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Button href={ROUTES.home} size="lg">Retour à l&apos;accueil</Button>
              <Button href={ROUTES.products} size="lg" variant="outline">Voir la boutique</Button>
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[420px]">
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
