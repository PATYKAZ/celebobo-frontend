import { Box, Category2, Chart2, DocumentText, Element3, Messages2, MoneyRecive, Notification, People, Profile2User, Share, Wallet3, type Icon } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import type { Permission } from "@/modules/auth/permissions";
import type { UserRole } from "@/modules/auth/types";

export interface AdminNavItem {
  label: string;
  /** Libellé alternatif pour le revendeur (« Mes commandes »…) */
  resellerLabel?: string;
  href: string;
  icon: Icon;
  /** true => actif uniquement sur l'URL exacte */
  exact?: boolean;
  /** Permission requise pour voir l'entrée */
  permission: Permission;
  /** Restreint à certains rôles (en plus de la permission) */
  onlyRoles?: UserRole[];
  section: "Pilotage" | "Catalogue" | "Activité" | "Équipe" | "Système";
  badge?: "messages" | "notifications";
}

/** Navigation du back-office — chaque entrée est filtrée par la matrice de permissions (modules/auth/permissions). */
export const ADMIN_NAV: AdminNavItem[] = [
  { section: "Pilotage", label: "Tableau de bord", resellerLabel: "Mon espace", href: ROUTES.admin.root, icon: Element3, exact: true, permission: "backoffice.access" },
  { section: "Pilotage", label: "Analytique", href: ROUTES.admin.analytics, icon: Chart2, permission: "analytics.view" },
  { section: "Catalogue", label: "Produits", resellerLabel: "Catalogue", href: ROUTES.admin.products, icon: Box, permission: "products.view" },
  { section: "Catalogue", label: "Catégories", href: ROUTES.admin.categories, icon: Category2, permission: "categories.manage" },
  { section: "Activité", label: "Commandes", resellerLabel: "Mes commandes", href: ROUTES.admin.orders, icon: Messages2, permission: "orders.view.own" },
  { section: "Activité", label: "Ventes", resellerLabel: "Mes ventes", href: ROUTES.admin.sales, icon: MoneyRecive, permission: "sales.view.own" },
  { section: "Activité", label: "Messages", resellerLabel: "Mes discussions", href: ROUTES.admin.inbox, icon: Messages2, permission: "inbox.view.own", badge: "messages" },
  { section: "Activité", label: "Notifications", href: ROUTES.admin.notifications, icon: Notification, permission: "backoffice.access", badge: "notifications" },
  { section: "Équipe", label: "Revendeurs", href: ROUTES.admin.resellers, icon: People, permission: "resellers.view" },
  { section: "Équipe", label: "Commissions", resellerLabel: "Mes commissions", href: ROUTES.admin.commissions, icon: Wallet3, permission: "commissions.view.own" },
  { section: "Équipe", label: "Mes invités", href: ROUTES.admin.invites, icon: Share, permission: "commissions.view.own", onlyRoles: ["revendeur"] },
  { section: "Système", label: "Utilisateurs & rôles", href: ROUTES.admin.users, icon: Profile2User, permission: "users.manage" },
  { section: "Système", label: "Journal d'audit", href: ROUTES.admin.audit, icon: DocumentText, permission: "audit.view" },
];
