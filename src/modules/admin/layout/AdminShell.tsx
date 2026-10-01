"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft2, HamburgerMenu, Logout, Notification } from "iconsax-reactjs";
import { useState, type ReactNode } from "react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { Logo } from "@/shared/layout/Logo";
import { Avatar } from "@/shared/ui/Avatar";
import { Drawer } from "@/shared/ui/Overlay";
import { useAuth, useLogout } from "@/modules/auth/hooks/useAuth";
import { displayName } from "@/modules/auth/types";
import { ADMIN_NAV } from "./nav";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {ADMIN_NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn("group relative flex items-center gap-3 rounded-box px-4 py-3 text-[14px] font-semibold transition-colors", active ? "text-white" : "text-ink-2 hover:bg-chip hover:text-ink")}
          >
            {active && <motion.span layoutId="admin-nav-active" className="absolute inset-0 rounded-box bg-primary" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
            <Icon size={20} variant={active ? "Bold" : "Linear"} className="relative transition-transform duration-300 group-hover:scale-110" />
            <span className="relative">{item.label}</span>
          </Link>
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
      <div className="px-5 pb-6 pt-6"><Logo /></div>
      <p className="px-6 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">Gestion</p>
      <div className="px-3"><NavList onNavigate={onNavigate} /></div>
      <div className="mt-auto space-y-2 p-3">
        <Link href={ROUTES.home} onClick={onNavigate} className="flex items-center gap-2 rounded-box bg-primary-50 px-4 py-3 text-[13px] font-bold text-primary transition-colors hover:bg-primary hover:text-white">
          <ArrowLeft2 size={16} /> Retour à la boutique
        </Link>
        {user && (
          <div className="flex items-center gap-3 rounded-box bg-chip p-3">
            <Avatar src={user.avatar} name={displayName(user)} size={38} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold leading-[18px]">{displayName(user)}</p>
              <p className="text-[11px] capitalize text-ink-3">{user.role}</p>
            </div>
            <button onClick={() => logout.mutate()} aria-label="Déconnexion" className="text-ink-3 transition-colors hover:text-danger"><Logout size={18} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Coquille du back-office : sidebar blanche (rad 10) + contenu en blocs blancs sur fond #E2E4EB. */
export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const current = ADMIN_NAV.find((n) => (n.exact ? pathname === n.href : pathname.startsWith(n.href)));

  return (
    <div className="mx-auto flex min-h-screen max-w-[1760px] gap-4 p-3 sm:p-4">
      <aside className="sticky top-4 hidden h-[calc(100vh-32px)] w-[270px] shrink-0 overflow-y-auto rounded-box bg-white lg:block">
        <SidebarBody />
      </aside>
      <Drawer open={open} onClose={() => setOpen(false)} title="Back-office">
        <SidebarBody onNavigate={() => setOpen(false)} />
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <header className="flex items-center gap-3 rounded-box bg-white px-4 py-3 sm:px-6">
          <button onClick={() => setOpen(true)} aria-label="Menu" className="grid size-10 place-items-center rounded-full bg-chip lg:hidden"><HamburgerMenu size={20} /></button>
          <div className="min-w-0">
            <p className="text-[12px] uppercase leading-[16px] tracking-wide text-ink-3">Back-office</p>
            <p className="truncate text-[16px] font-bold leading-[22px]">{current?.label ?? "Administration"}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link href={ROUTES.notifications} aria-label="Notifications" className="relative grid size-10 place-items-center rounded-full bg-chip transition-colors hover:bg-primary hover:text-white">
              <Notification size={19} variant="Bold" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-danger ring-2 ring-chip" />
            </Link>
          </div>
        </header>
        <main className="flex flex-col gap-4">{children}</main>
      </div>
    </div>
  );
}
