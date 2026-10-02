"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { More, type Icon } from "iconsax-reactjs";
import { useEffect, useId } from "react";
import { cn } from "@/shared/lib/cn";

export interface TabItem {
  key: string;
  label: string;
  href: string;
  icon: Icon;
  /** actif uniquement sur l'URL exacte */
  exact?: boolean;
  /** préfixes supplémentaires considérés comme « actifs » */
  alsoActive?: string[];
  badge?: number;
}

interface Props {
  items: TabItem[];
  /** Ouvre la feuille « Plus » */
  onMore: () => void;
  moreActive?: boolean;
  moreBadge?: number;
  /** Chemins pour lesquels la barre est masquée (ex: conversation plein écran) */
  hideOn?: (pathname: string) => boolean;
}

/**
 * Barre d'onglets mobile (< lg) : 4 raccourcis + « Plus ».
 * L'onglet actif a une pastille teintée qui glisse d'un onglet à l'autre ; badges animés ; zone sûre iOS.
 * Quand elle est masquée, la variable CSS `--tabbar-h` passe à 0 pour que le contenu récupère la place.
 */
export function TabBar({ items, onMore, moreActive, moreBadge, hideOn }: Props) {
  const pathname = usePathname();
  const id = useId();
  const hidden = !!hideOn?.(pathname);

  useEffect(() => {
    const root = document.documentElement;
    if (hidden) root.style.setProperty("--tabbar-h", "0px");
    else root.style.removeProperty("--tabbar-h");
    return () => {
      root.style.removeProperty("--tabbar-h");
    };
  }, [hidden]);

  if (hidden) return null;

  const isActive = (t: TabItem) => (t.exact ? pathname === t.href : pathname === t.href || pathname.startsWith(`${t.href}/`) || !!t.alsoActive?.some((p) => pathname.startsWith(p)));
  const cell = "relative flex flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 text-[10.5px] font-semibold leading-[14px] transition-colors active:scale-95";

  return (
    <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-50 border-t border-line-3 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-16 max-w-[640px] items-stretch px-1">
        {items.map((t) => {
          const active = isActive(t);
          const Icon = t.icon;
          return (
            <Link key={t.key} href={t.href} aria-current={active ? "page" : undefined} className={cn(cell, active ? "text-primary" : "text-ink-3")}>
              <span className="relative grid h-8 w-14 place-items-center">
                {active && <motion.span layoutId={`tab-pill-${id}`} className="absolute inset-0 rounded-full bg-primary-100" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <Icon size={22} variant={active ? "Bold" : "Linear"} className="relative" />
                <AnimatePresence>
                  {!!t.badge && (
                    <motion.span key={t.badge} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute right-1.5 top-0 grid min-w-[17px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold leading-[17px] text-white ring-2 ring-white">
                      {t.badge > 99 ? "99+" : t.badge}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <span className="max-w-full truncate px-0.5">{t.label}</span>
            </Link>
          );
        })}
        <button onClick={onMore} aria-haspopup="dialog" className={cn(cell, moreActive ? "text-primary" : "text-ink-3")}>
          <span className="relative grid h-8 w-14 place-items-center">
            {moreActive && <motion.span layoutId={`tab-pill-${id}`} className="absolute inset-0 rounded-full bg-primary-100" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <More size={22} variant={moreActive ? "Bold" : "Linear"} className="relative" />
            {!!moreBadge && <span className="absolute right-1.5 top-0 grid min-w-[17px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold leading-[17px] text-white ring-2 ring-white">{moreBadge}</span>}
          </span>
          <span>Plus</span>
        </button>
      </div>
    </nav>
  );
}
