"use client";

import { motion } from "motion/react";
import { ToggleGroup } from "radix-ui";
import { useEffect, useId, useRef } from "react";
import { cn } from "@/shared/lib/cn";

interface Tab<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface Props<T extends string> {
  tabs: Tab<T>[];
  value: T;
  onChange: (v: T) => void;
  /** "title" : onglets du design (18px upper, actif 600 / inactif 400 opacity .6). "pill" : segmenté (admin). */
  variant?: "title" | "pill";
  className?: string;
  /** Nom du groupe pour les lecteurs d'écran (ex. « Période ») */
  label?: string;
}

/**
 * Onglets de filtre (choix unique, sans panneau associé) : Radix ToggleGroup — flèches pour se déplacer,
 * Entrée / Espace pour choisir, état annoncé. Sur mobile : rangée défilante (snap) avec fondu aux bords, l'onglet actif est
 * automatiquement recentré. Sur desktop : rendu inchangé.
 */
export function Tabs<T extends string>({ tabs, value, onChange, variant = "title", className, label }: Props<T>) {
  const id = useId();
  const row = useRef<HTMLDivElement>(null);

  // recentre l'onglet actif dans la rangée défilante — horizontalement seulement : scrollIntoView ferait
  // aussi défiler la page jusqu'aux onglets dès l'ouverture (fiche produit sur mobile)
  useEffect(() => {
    const strip = row.current;
    const el = strip?.querySelector<HTMLElement>('[data-state="on"]');
    if (!strip || !el || strip.scrollWidth <= strip.clientWidth) return;
    const offset = el.getBoundingClientRect().left - strip.getBoundingClientRect().left;
    strip.scrollTo({ left: strip.scrollLeft + offset - (strip.clientWidth - el.offsetWidth) / 2, behavior: "smooth" });
  }, [value]);

  // fondu à droite uniquement (indique qu'on peut défiler) : un fondu à gauche rognerait le 1er onglet au repos
  const fade = "mask-[linear-gradient(90deg,#000_calc(100%-28px),transparent)] sm:mask-none";

  if (variant === "pill") {
    return (
      <div className={cn("-mx-1 max-w-full overflow-hidden", className)}>
        <ToggleGroup.Root ref={row} type="single" value={value} onValueChange={(v) => v && onChange(v as T)} aria-label={label} className={cn("no-scrollbar flex snap-x snap-mandatory gap-1 overflow-x-auto px-1 py-0.5 sm:inline-flex sm:rounded-full sm:bg-chip sm:p-1", fade)}>
          {tabs.map((t) => (
            <ToggleGroup.Item
              key={t.value}
              value={t.value}
              className={cn(
                "relative shrink-0 snap-center whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-semibold transition-colors sm:py-1.5",
                t.value === value ? "text-white" : "bg-chip text-ink-2 hover:text-ink sm:bg-transparent",
              )}
            >
              {t.value === value && <motion.span layoutId={`pill-${id}`} className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className="relative">
                {t.label}
                {t.count != null && <span className="ml-1.5 opacity-70">{t.count}</span>}
              </span>
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </div>
    );
  }
  return (
    <div className={cn("max-w-full overflow-hidden", className)}>
      <ToggleGroup.Root ref={row} type="single" value={value} onValueChange={(v) => v && onChange(v as T)} aria-label={label} className={cn("no-scrollbar flex snap-x snap-mandatory items-center gap-x-6 overflow-x-auto sm:flex-wrap sm:gap-x-10 sm:gap-y-2 sm:overflow-visible", fade)}>
        {tabs.map((t) => (
          <ToggleGroup.Item
            key={t.value}
            value={t.value}
            className={cn("relative min-h-11 shrink-0 snap-center whitespace-nowrap text-[15px] uppercase leading-[22px] transition-all sm:min-h-0 sm:py-0 sm:pb-1 sm:text-tab", t.value === value ? "font-semibold" : "opacity-60 hover:opacity-100")}
          >
            {t.label}
            {t.value === value && <motion.span layoutId={`tab-${id}`} className="absolute inset-x-0 -bottom-0.5 h-[3px] rounded-full bg-primary" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    </div>
  );
}
