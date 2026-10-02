"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft2, HamburgerMenu, Logout, Messages2, Notification } from "iconsax-reactjs";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { Logo } from "@/shared/layout/Logo";
import { Avatar } from "@/shared/ui/Avatar";
import { Drawer } from "@/shared/ui/Overlay";
import { useAuth, useLogout } from "@/modules/auth/hooks/useAuth";
import { can, ROLE_LABEL } from "@/modules/auth/permissions";
import { displayName } from "@/modules/auth/types";
import { useUnreadMessagesCount } from "@/modules/messaging/hooks/useConversations";
import { useUnreadNotificationsCount } from "@/modules/messaging/hooks/useNotifications";
import { DemoRoleSwitcher } from "./DemoRoleSwitcher";
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

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = useVisibleNav();
  const counts = { messages: useUnreadMessagesCount(), notifications: useUnreadNotificationsCount() };
  let last = "";

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item, idx) => {
        const active = isActive(item, pathname);
        const Icon = item.icon;
        const showSection = item.section !== last;
        last = item.section;
        const n = item.badge ? counts[item.badge] : 0;
        return (
          <Fragment key={item.href}>
            {showSection && <p className={cn("px-4 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3", idx > 0 && "pt-4")}>{item.section}</p>}
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn("group relative flex items-center gap-3 rounded-box px-4 py-2.5 text-[14px] font-semibold transition-colors", active ? "text-white" : "text-ink-2 hover:bg-chip hover:text-ink")}
            >
              {active && <motion.span layoutId="admin-nav-active" className="absolute inset-0 rounded-box bg-primary" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
              <Icon size={19} variant={active ? "Bold" : "Linear"} className="relative transition-transform duration-300 group-hover:scale-110" />
              <span className="relative flex-1">{item.label}</span>
              {n > 0 && <span className={cn("relative grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold leading-5", active ? "bg-white text-primary" : "bg-danger text-white")}>{n}</span>}
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const logout = useLogout();
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-5 pt-6"><Logo /></div>
      <div className="flex-1 overflow-y-auto px-3"><NavList onNavigate={onNavigate} /></div>
      <div className="space-y-2 p-3">
        <Link href={ROUTES.home} onClick={onNavigate} className="flex items-center gap-2 rounded-box bg-primary-50 px-4 py-3 text-[13px] font-bold text-primary transition-colors hover:bg-primary hover:text-white">
          <ArrowLeft2 size={16} /> Retour à la boutique
        </Link>
        {user && (
          <div className="flex items-center gap-3 rounded-box bg-chip p-3">
            <Avatar src={user.avatar} name={displayName(user)} size={38} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold leading-[18px]">{displayName(user)}</p>
              <p className="text-[11px] text-ink-3">{ROLE_LABEL[user.role]}</p>
            </div>
            <button onClick={() => logout.mutate()} aria-label="Déconnexion" className="text-ink-3 transition-colors hover:text-danger"><Logout size={18} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Coquille du back-office : sidebar blanche (rad 10) + contenu en blocs blancs sur fond #E2E4EB. Menu adapté au rôle. */
export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const items = useVisibleNav();
  const current = [...items].sort((a, b) => b.href.length - a.href.length).find((n) => isActive(n, pathname));
  const nMsgs = useUnreadMessagesCount();
  const nNotifs = useUnreadNotificationsCount();

  return (
    <div className="mx-auto flex min-h-screen max-w-[1760px] gap-4 p-3 sm:p-4">
      <aside className="sticky top-4 hidden h-[calc(100vh-32px)] w-[270px] shrink-0 overflow-hidden rounded-box bg-white lg:block">
        <SidebarBody />
      </aside>
      <Drawer open={open} onClose={() => setOpen(false)} title="Back-office">
        <SidebarBody onNavigate={() => setOpen(false)} />
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <header className="flex items-center gap-3 rounded-box bg-white px-4 py-3 sm:px-6">
          <button onClick={() => setOpen(true)} aria-label="Menu" className="grid size-10 place-items-center rounded-full bg-chip lg:hidden"><HamburgerMenu size={20} /></button>
          <div className="min-w-0">
            <p className="text-[12px] uppercase leading-[16px] tracking-wide text-ink-3">{user?.role === "revendeur" ? "Espace revendeur" : "Back-office"}</p>
            <p className="truncate text-[16px] font-bold leading-[22px]">{current?.label ?? "Administration"}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <DemoRoleSwitcher />
            <Link href={ROUTES.admin.inbox} aria-label="Messages" className="relative grid size-10 place-items-center rounded-full bg-chip transition-colors hover:bg-primary hover:text-white">
              <Messages2 size={19} variant="Bold" />
              {nMsgs > 0 && <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] leading-[18px] text-white ring-2 ring-white">{nMsgs}</span>}
            </Link>
            <Link href={ROUTES.admin.notifications} aria-label="Notifications" className="relative grid size-10 place-items-center rounded-full bg-chip transition-colors hover:bg-primary hover:text-white">
              <Notification size={19} variant="Bold" />
              {nNotifs > 0 && <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] leading-[18px] text-white ring-2 ring-white">{nNotifs}</span>}
            </Link>
          </div>
        </header>
        <main className="flex flex-col gap-4">{children}</main>
      </div>
    </div>
  );
}
