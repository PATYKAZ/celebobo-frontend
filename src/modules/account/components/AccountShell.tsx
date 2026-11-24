"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowRight2, DocumentDownload, Gift, Location, Notification, Profile, Receipt2, ShieldTick, WalletMoney } from "@/shared/ui/icons";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { Block } from "@/shared/ui/Block";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { PointsCard } from "@/modules/points/components/PointsCard";
import { usePointsBalance } from "@/modules/points/hooks/usePoints";
import { holdsPoints } from "@/modules/points/types";

/** Menu du compte : le même sur toutes les pages /compte, avec la page courante mise en évidence. */
export function AccountNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { data: points } = usePointsBalance(holdsPoints(user?.role));
  const links = [
    { href: ROUTES.profile, label: "Mon profil", icon: Profile },
    { href: ROUTES.orders, label: "Mes commandes", icon: Receipt2 },
    { href: ROUTES.myClaims, label: "Mes réclamations", icon: ShieldTick },
    { href: ROUTES.storeCredit, label: "Mon avoir", icon: WalletMoney },
    ...(points?.eligible ? [{ href: ROUTES.points, label: "Mes points de fidélité", icon: Gift }] : []),
    { href: ROUTES.addresses, label: "Mes adresses", icon: Location },
    { href: ROUTES.settings, label: "Notifications et préférences", icon: Notification },
    { href: ROUTES.myData, label: "Mes données", icon: DocumentDownload },
    { href: ROUTES.consents, label: "Mes consentements", icon: ShieldTick },
  ];
  return (
    <Block pad="sm" className="p-2!">
      <nav aria-label="Mon compte">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex min-h-12 items-center gap-3 rounded-box px-3 py-2 text-sm font-semibold transition-colors hover:bg-chip active:bg-chip",
                active && "bg-primary-50 text-primary hover:bg-primary-50",
              )}
            >
              <span className={cn("grid size-9 place-items-center rounded-full bg-chip transition-colors group-hover:bg-primary group-hover:text-white", active && "bg-primary text-white")}>
                <Icon size={17} variant={active ? "Bold" : "Linear"} />
              </span>
              <span className="flex-1">{label}</span>
              <ArrowRight2 size={14} className="text-ink-3 transition-transform group-hover:translate-x-1" />
            </Link>
          );
        })}
      </nav>
    </Block>
  );
}

/**
 * Mise en page commune des pages du compte : menu à gauche sur grand écran, contenu à droite.
 * Sur téléphone le menu reste sur la page Profil (point d'entrée du compte) ; ailleurs le fil d'Ariane ramène au compte.
 */
export function AccountShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="hidden min-w-0 space-y-3 sm:space-y-4 lg:block">
        <PointsCard />
        <AccountNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
