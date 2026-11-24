"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown2, ArrowLeft2, Logout, Messages2, Notification } from "@/shared/ui/icons";
import { useMemo, useState, type ReactNode } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { Logo } from "@/shared/layout/Logo";
import { Avatar } from "@/shared/ui/Avatar";
import { useAuth, useLogout } from "@/modules/auth/hooks/useAuth";
import { can, ROLE_LABEL } from "@/modules/auth/permissions";
import { displayName } from "@/modules/auth/types";
import { useUnreadMessagesCount } from "@/modules/messaging/hooks/useConversations";
import { useUnreadNotificationsCount } from "@/modules/messaging/hooks/useNotifications";
import { ThemeToggle } from "@/shared/theme/ThemeSwitch";
import { AdminTabBar } from "./AdminTabBar";
import { ADMIN_NAV, type AdminNavItem } from "./nav";

const isActive = (item: AdminNavItem, pathname: string) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));

function useVisibleNav() {
  const { user } = useAuth();
  return useMemo(
    () =>
      ADMIN_NAV.filter((i) => can(user, i.permission) && (!i.onlyRoles || (user && i.onlyRoles.includes(user.role)))).map((i) => ({
        ...i,
        label: user?.role === "revendeur" && i.resellerLabel ? i.resellerLabel : i.label,
      })),
    [user],
  );
}

/** Sidebar desktop : sections repliables (titre + pastille de comptage), l'entrée active glisse d'un lien à l'autre. */
function NavList() {
  const pathname = usePathname();
  const items = useVisibleNav();
  const counts = { messages: useUnreadMessagesCount(), notifications: useUnreadNotificationsCount() };
  // sections de configuration repliées au départ (elles s'ouvrent quand on y est) : l'activité du jour reste visible sans défiler
  const [closed, setClosed] = useState<Record<string, boolean>>({ Catalogue: true, Système: true });

  const sections = useMemo(() => {
    const out: { title: string; items: typeof items }[] = [];
    for (const i of items) {
      let s = out.find((x) => x.title === i.section);
      if (!s) out.push((s = { title: i.section, items: [] }));
      s.items.push(i);
    }
    return out;
  }, [items]);

  return (
    <nav className="flex flex-col gap-1">
      {sections.map((s) => {
        const unread = s.items.reduce((n, i) => n + (i.badge ? counts[i.badge] : 0), 0);
        const hasActive = s.items.some((i) => isActive(i, pathname));
        const open = !closed[s.title] || hasActive;
        return (
          <div key={s.title}>
            <button
              onClick={() => setClosed((c) => ({ ...c, [s.title]: open }))}
              aria-expanded={open}
              className="flex w-full items-center gap-2 px-4 pb-1 pt-3 text-left text-xs font-bold text-ink-3 transition-colors hover:text-ink"
            >
              <ArrowDown2 size={12} className={cn("transition-transform", !open && "-rotate-90")} />
              <span className="flex-1">{s.title}</span>
              {unread > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-danger-100 px-1.5 text-xs font-semibold tabular-nums text-danger">{unread}</span>}
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="flex flex-col gap-0.5 py-0.5">
                    {s.items.map((item) => {
                      const active = isActive(item, pathname);
                      const Icon = item.icon;
                      const n = item.badge ? counts[item.badge] : 0;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn("group relative flex items-center gap-3 rounded-box px-4 py-2.5 text-sm font-semibold transition-colors", active ? "text-white" : "text-ink-2 hover:bg-chip hover:text-ink")}
                        >
                          {active && <motion.span layoutId="admin-nav-active" className="absolute inset-0 rounded-box bg-primary" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                          <Icon size={19} variant={active ? "Bold" : "Linear"} className="relative transition-transform duration-300 group-hover:scale-110" />
                          <span className="relative flex-1">{item.label}</span>
                          {n > 0 && <span className={cn("relative grid min-w-5 place-items-center rounded-full px-1.5 text-xs font-bold leading-5", active ? "bg-surface text-primary" : "bg-danger text-white")}>{n}</span>}
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}

function SidebarBody() {
  const { user } = useAuth();
  const logout = useLogout();
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-6"><Logo /></div>
      <div className="flex-1 overflow-y-auto px-3 pb-3"><NavList /></div>
      <div className="space-y-2 border-t border-line-3 p-3">
        <Link href={ROUTES.home} className="flex items-center gap-2 rounded-box bg-primary-50 px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white">
          <ArrowLeft2 size={16} /> Retour à la boutique
        </Link>
        {user && (
          <div className="flex items-center gap-3 rounded-box bg-chip p-3">
            <Avatar src={user.avatar} name={displayName(user)} size={38} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{displayName(user)}</p>
              <p className="text-xs text-ink-3">{ROLE_LABEL[user.role]}</p>
            </div>
            <button onClick={() => logout.mutate()} aria-label="Déconnexion" className="text-ink-3 transition-colors hover:text-danger"><Logout size={18} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Coquille du back-office : sidebar blanche (rad 10) + contenu en blocs blancs sur fond #E2E4EB. Menu adapté au rôle.
 * Mobile : en-tête compact + barre d'onglets en bas (AdminTabBar) ; `pb-tabbar` réserve sa hauteur.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const items = useVisibleNav();
  const current = [...items].sort((a, b) => b.href.length - a.href.length).find((n) => isActive(n, pathname));
  const nMsgs = useUnreadMessagesCount();
  const nNotifs = useUnreadNotificationsCount();

  const circle = "relative grid size-10 shrink-0 place-items-center rounded-full bg-chip transition-colors hover:bg-primary hover:text-white active:scale-90";
  const dot = "absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-danger px-1 text-xs text-white ring-2 ring-surface";

  return (
    <div className="flex min-h-[calc(var(--dvh)*100)] w-full gap-4 p-3 pb-[calc(var(--tabbar-h)+12px)] sm:p-4 sm:pb-[calc(var(--tabbar-h)+16px)]">
      <aside className="sticky top-4 hidden h-[calc(calc(var(--dvh)*100)-32px)] w-[270px] shrink-0 overflow-hidden rounded-box bg-surface lg:block">
        <SidebarBody />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
        <header className="flex items-center gap-2.5 rounded-box bg-surface px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
          <span className="lg:hidden"><Logo compact /></span>
          <div className="min-w-0 flex-1">
            {/* simple repère (section · page) : le titre de la page est dans son en-tête, pas répété en gras ici */}
            <p className="truncate text-sm text-ink-2">
              <span className="max-sm:hidden">{user?.role === "revendeur" ? "Espace revendeur" : current?.section ?? "Back-office"} · </span>
              <span className="font-semibold text-ink">{current?.label ?? "Administration"}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* la messagerie a son onglet dans la barre mobile */}
            <Link href={ROUTES.admin.inbox} aria-label="Messages" className={cn(circle, "max-lg:hidden")}>
              <Messages2 size={19} variant="Bold" />
              {nMsgs > 0 && <span className={dot}>{nMsgs}</span>}
            </Link>
            <ThemeToggle className={circle} />
            <Link href={ROUTES.admin.notifications} aria-label="Notifications" className={circle}>
              <Notification size={19} variant="Bold" />
              {nNotifs > 0 && <span className={dot}>{nNotifs}</span>}
            </Link>
          </div>
        </header>
        <main className="flex min-w-0 flex-col gap-3 sm:gap-4">{children}</main>
      </div>
      <AdminTabBar />
    </div>
  );
}
