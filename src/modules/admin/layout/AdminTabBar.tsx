"use client";

import { usePathname } from "next/navigation";
import { ArrowLeft2, Logout } from "iconsax-reactjs";
import { useMemo, useState } from "react";
import { ROUTES } from "@/config/routes";
import { MoreSheet, type MoreSection } from "@/shared/ui/MoreSheet";
import { TabBar, type TabItem } from "@/shared/ui/TabBar";
import { useAuth, useLogout } from "@/modules/auth/hooks/useAuth";
import { can } from "@/modules/auth/permissions";
import { useUnreadMessagesCount } from "@/modules/messaging/hooks/useConversations";
import { useUnreadNotificationsCount } from "@/modules/messaging/hooks/useNotifications";
import { ADMIN_NAV } from "./nav";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** 4 raccourcis principaux affichés dans la barre (le reste est dans « Plus »). */
const PRIMARY: string[] = [ROUTES.admin.root, ROUTES.admin.orders, ROUTES.admin.sales, ROUTES.admin.inbox];

/** Pages plein écran (chat) : la barre est masquée. */
const HIDE = (p: string) => p.startsWith(`${ROUTES.admin.inbox}/`);

/** Barre d'onglets du back-office (mobile < lg) + feuille « Plus de pages » groupée par section. */
export function AdminTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const logout = useLogout();
  const msgs = useUnreadMessagesCount();
  const notifs = useUnreadNotificationsCount();
  const [more, setMore] = useState(false);

  const visible = useMemo(
    () =>
      ADMIN_NAV.filter((i) => can(user, i.permission) && (!i.onlyRoles || (user && i.onlyRoles.includes(user.role)))).map((i) => ({
        ...i,
        label: user?.role === "revendeur" && i.resellerLabel ? i.resellerLabel : i.label,
      })),
    [user],
  );

  const badge = (b?: "messages" | "notifications") => (b === "messages" ? msgs : b === "notifications" ? notifs : 0) || undefined;

  const tabs: TabItem[] = PRIMARY.map((href) => visible.find((v) => v.href === href))
    .filter((v): v is NonNullable<typeof v> => !!v)
    .map((v) => ({
      key: v.href,
      label: v.href === ROUTES.admin.root ? (user?.role === "revendeur" ? "Mon espace" : "Accueil") : cap(v.label.replace("Mes ", "").replace("Commandes & discussions", "Commandes")),
      href: v.href,
      icon: v.icon,
      exact: v.exact,
      badge: badge(v.badge),
    }));

  const rest = visible.filter((v) => !PRIMARY.includes(v.href));
  const sections: MoreSection[] = [];
  for (const v of rest) {
    let s = sections.find((x) => x.title === v.section);
    if (!s) sections.push((s = { title: v.section, items: [] }));
    s.items.push({ label: v.label, href: v.href, icon: v.icon, badge: badge(v.badge) });
  }
  sections.push({
    title: "Compte",
    items: [
      { label: "Boutique", href: ROUTES.home, icon: ArrowLeft2 },
      { label: "Déconnexion", icon: Logout, danger: true, onClick: () => logout.mutate() },
    ],
  });

  const moreActive = !tabs.some((t) => (t.exact ? pathname === t.href : pathname.startsWith(t.href)));

  return (
    <>
      <TabBar items={tabs} onMore={() => setMore(true)} moreActive={moreActive} moreBadge={rest.reduce((n, v) => n + (badge(v.badge) ?? 0), 0) || undefined} hideOn={HIDE} />
      <MoreSheet open={more} onClose={() => setMore(false)} title={user?.role === "revendeur" ? "Mon espace" : "Plus de pages"} sections={sections} />
    </>
  );
}
