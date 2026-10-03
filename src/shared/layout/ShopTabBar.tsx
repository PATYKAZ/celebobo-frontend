"use client";

import { usePathname } from "next/navigation";
import { Bag2, Call, DocumentText, Heart, Home2, InfoCircle, Location, Login, Logout, MagicStar, Messages2, Notification, People, Profile, Receipt2, Setting2, Shop, TruckFast, UserAdd } from "iconsax-reactjs";
import { useMemo, useState } from "react";
import { ROUTES } from "@/config/routes";
import { MoreSheet, type MoreSection } from "@/shared/ui/MoreSheet";
import { TabBar, type TabItem } from "@/shared/ui/TabBar";
import { useAuth, useLogout } from "@/modules/auth/hooks/useAuth";
import { useCart } from "@/modules/cart/hooks/useCart";
import { CategoryIcon } from "@/modules/categories/components/CategoryIcon";
import { useCategories } from "@/modules/categories/hooks/useCategories";
import { useUnreadMessagesCount } from "@/modules/messaging/hooks/useConversations";
import { useUnreadNotificationsCount } from "@/modules/messaging/hooks/useNotifications";
import { useSiteSettings } from "@/modules/site";

/** Pages plein écran où la barre d'onglets est masquée (chat, assistant, paiement). */
const HIDE = (p: string) => p.startsWith("/messages/") || p === "/assistant" || p === "/commande";

const MORE_PATHS = ["/favoris", "/messages", "/notifications", "/a-propos", "/guide", "/contact", "/devenir-revendeur", "/suivi", "/compte/commandes", "/compte/adresses", "/compte/parametres"];

/** Barre d'onglets + feuille « Plus » de la boutique (mobile < lg). */
export function ShopTabBar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isStaff } = useAuth();
  const { count } = useCart();
  const site = useSiteSettings();
  // les compteurs n'ont de sens que pour un utilisateur connecté (les mocks retombent sur un acteur par défaut)
  const rawMsgs = useUnreadMessagesCount();
  const rawNotifs = useUnreadNotificationsCount(isStaff);
  const msgs = isAuthenticated ? rawMsgs : 0;
  const notifs = isStaff ? rawNotifs : 0;
  const { data: categories } = useCategories();
  const logout = useLogout();
  const [more, setMore] = useState(false);

  const tabs: TabItem[] = [
    { key: "home", label: "Accueil", href: ROUTES.home, icon: Home2, exact: true },
    { key: "shop", label: "Produits", href: ROUTES.products, icon: Shop, alsoActive: ["/categorie", "/recherche"] },
    { key: "cart", label: "Panier", href: ROUTES.cart, icon: Bag2, badge: count, alsoActive: ["/commande"] },
    isAuthenticated
      ? { key: "account", label: "Compte", href: ROUTES.profile, icon: Profile, alsoActive: ["/compte/profil"] }
      : { key: "login", label: "Connexion", href: ROUTES.login(), icon: Login, alsoActive: ["/inscription"] },
  ];

  const sections = useMemo<MoreSection[]>(
    () => [
      {
        title: "Catégories",
        items: (categories ?? []).map((c) => ({ label: c.name, href: ROUTES.category(c.slug), iconNode: <CategoryIcon name={c.icon} size={22} /> })),
      },
      {
        title: "Mon compte",
        items: [
          { label: "Commandes", href: ROUTES.orders, icon: Receipt2 },
          { label: "Favoris", href: ROUTES.favorites, icon: Heart },
          { label: "Messages", href: isStaff ? ROUTES.admin.inbox : ROUTES.messages, icon: Messages2, badge: msgs || undefined },
          { label: "Adresses", href: ROUTES.addresses, icon: Location },
          { label: "Paramètres", href: ROUTES.settings, icon: Setting2 },
          { label: "Suivi", href: ROUTES.track, icon: TruckFast },
        ],
      },
      ...(isStaff
        ? [
            {
              title: user?.role === "revendeur" ? "Espace revendeur" : "Back-office",
              items: [
                { label: user?.role === "revendeur" ? "Mon espace" : "Tableau de bord", href: ROUTES.admin.root, icon: Setting2 },
                { label: "Notifications", href: ROUTES.admin.notifications, icon: Notification, badge: notifs || undefined },
              ],
            },
          ]
        : []),
      {
        title: "Celebobo",
        items: [
          { label: "À propos", href: ROUTES.about, icon: InfoCircle },
          { label: "Guide d'achat", href: ROUTES.guide, icon: DocumentText },
          { label: "Assistant", href: ROUTES.assistant, icon: MagicStar },
          { label: "Contact", href: ROUTES.contact, icon: Call },
          { label: "Devenir revendeur", href: ROUTES.becomeReseller, icon: People },
          ...(!isAuthenticated ? [{ label: "Inscription", href: ROUTES.register, icon: UserAdd }] : []),
        ],
      },
    ],
    [categories, isStaff, msgs, notifs, user?.role, isAuthenticated],
  );

  return (
    <>
      <TabBar items={tabs} onMore={() => setMore(true)} moreActive={MORE_PATHS.some((p) => pathname.startsWith(p))} moreBadge={(msgs || 0) + (notifs || 0) || undefined} hideOn={HIDE} />
      <MoreSheet
        open={more}
        onClose={() => setMore(false)}
        sections={sections}
        footer={
          <div className="space-y-2.5">
            <a href={site.hotlineHref} className="flex items-center justify-between rounded-box bg-primary-50 p-4">
              <span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-2">Hotline 24/7</span>
                <span className="text-[20px] font-bold text-primary">{site.hotline}</span>
              </span>
              <span className="grid size-11 place-items-center rounded-full bg-primary text-white"><Call size={20} variant="Bold" /></span>
            </a>
            {isAuthenticated && (
              <button onClick={() => { setMore(false); logout.mutate(); }} className="flex w-full items-center justify-center gap-2 rounded-box bg-chip py-3 text-[13px] font-bold text-danger active:scale-[0.98]">
                <Logout size={17} /> Se déconnecter
              </button>
            )}
          </div>
        }
      />
    </>
  );
}
