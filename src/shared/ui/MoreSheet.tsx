"use client";

import Link from "next/link";
import { RevealGroup, RevealItem } from "@/shared/animations/Reveal";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import type { ReactNode } from "react";
import type { Icon } from "iconsax-reactjs";

export interface MoreItem {
  label: string;
  href?: string;
  icon?: Icon;
  /** Icône personnalisée (ex: icône de catégorie) — prioritaire sur `icon` */
  iconNode?: ReactNode;
  badge?: number;
  onClick?: () => void;
  /** teinte danger (déconnexion) */
  danger?: boolean;
}

export interface MoreSection {
  title: string;
  items: MoreItem[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  sections: MoreSection[];
  /** Bloc libre sous la grille (hotline, profil…) */
  footer?: ReactNode;
  action?: ReactNode;
}

/** « Plus de pages » : grille d'icônes (4 colonnes) groupée par section, comme les applications natives. */
export function MoreSheet({ open, onClose, title = "Plus de pages", sections, footer, action }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} action={action}>
      <RevealGroup stagger={0.03} className="space-y-5 pb-2 pt-1">
        {sections
          .filter((s) => s.items.length > 0)
          .map((s) => (
            <RevealItem key={s.title}>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">{s.title}</p>
              <div className="grid grid-cols-4 gap-x-1 gap-y-3">
                {s.items.map((it) => {
                  const Icon = it.icon;
                  const inner = (
                    <>
                      <span className={`relative grid size-12 place-items-center rounded-[16px] transition-colors group-active:scale-90 ${it.danger ? "bg-danger-100 text-danger" : "bg-chip text-ink group-hover:bg-primary-100 group-hover:text-primary-dark"}`}>
                        {it.iconNode ?? (Icon ? <Icon size={22} variant="Linear" /> : null)}
                        {!!it.badge && <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-white">{it.badge}</span>}
                      </span>
                      <span className="line-clamp-2 text-center text-[11px] font-semibold leading-[14px]">{it.label}</span>
                    </>
                  );
                  const cls = "group flex flex-col items-center gap-1.5 rounded-box p-1 active:bg-chip";
                  return it.href ? (
                    <Link key={it.label} href={it.href} onClick={() => { it.onClick?.(); onClose(); }} className={cls}>{inner}</Link>
                  ) : (
                    <button key={it.label} onClick={() => { it.onClick?.(); onClose(); }} className={cls}>{inner}</button>
                  );
                })}
              </div>
            </RevealItem>
          ))}
        {footer && <RevealItem>{footer}</RevealItem>}
      </RevealGroup>
    </BottomSheet>
  );
}
