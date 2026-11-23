import { Award, Box, DocumentDownload, MessageQuestion, MessageText1, Sms, SmsNotification, Star1, UserAdd, Warning2, Category2, Chart2, DocumentText, Element3, Flash, Gallery, Gift, RowVertical, Messages2, MoneyRecive, Notification, People, Profile2User, Setting2, Share, ShieldTick, TicketDiscount, TicketStar, Wallet3, type Icon } from "@/shared/ui/icons";
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
  { section: "Pilotage", label: "Tableau de bord", resellerLabel: "Mon espace", href: ROUTES.admin.root, icon: Element3, exact: true, permission: "dashboard.view" },
  { section: "Pilotage", label: "Analytique", href: ROUTES.admin.analytics, icon: Chart2, permission: "analytics.view" },
  { section: "Catalogue", label: "Produits", resellerLabel: "Catalogue", href: ROUTES.admin.products, icon: Box, permission: "products.view" },
  { section: "Catalogue", label: "Catégories", href: ROUTES.admin.categories, icon: Category2, permission: "categories.manage" },
  { section: "Catalogue", label: "Alertes de stock", href: ROUTES.admin.stockAlerts, icon: Warning2, permission: "products.manage" },
  { section: "Catalogue", label: "Avis clients", href: ROUTES.admin.reviews, icon: Star1, permission: "reviews.moderate" },
  { section: "Catalogue", label: "Offres du jour", href: ROUTES.admin.deals, icon: Flash, permission: "products.manage" },
  { section: "Catalogue", label: "Codes promo", href: ROUTES.admin.coupons, icon: TicketDiscount, permission: "coupons.manage" },
  { section: "Catalogue", label: "Blocs de l'accueil", href: ROUTES.admin.homeSections, icon: RowVertical, permission: "content.manage" },
  { section: "Catalogue", label: "Bannières de l'accueil", href: ROUTES.admin.banners, icon: Gallery, permission: "content.manage" },
  { section: "Catalogue", label: "FAQ", href: ROUTES.admin.faq, icon: MessageText1, permission: "content.manage" },
  { section: "Catalogue", label: "Pages et politiques", href: ROUTES.admin.pages, icon: DocumentText, permission: "content.manage" },
  { section: "Activité", label: "Commandes", resellerLabel: "Mes commandes", href: ROUTES.admin.orders, icon: Messages2, permission: "orders.view.assigned" },
  { section: "Activité", label: "Réclamations", href: ROUTES.admin.claims, icon: ShieldTick, permission: "claims.manage" },
  { section: "Activité", label: "Ventes", resellerLabel: "Mes ventes", href: ROUTES.admin.sales, icon: MoneyRecive, permission: "sales.view.own" },
  { section: "Activité", label: "Messages", resellerLabel: "Mes discussions", href: ROUTES.admin.inbox, icon: Messages2, permission: "conversations.moderate", badge: "messages" },
  { section: "Activité", label: "Messages de contact", href: ROUTES.admin.contact, icon: Sms, permission: "contact.inbox" },
  { section: "Activité", label: "Newsletter", href: ROUTES.admin.newsletter, icon: SmsNotification, permission: "newsletter.view" },
  { section: "Activité", label: "Assistant", href: ROUTES.admin.assistant, icon: MessageQuestion, permission: "assistant.logs" },
  { section: "Activité", label: "Mes exports", href: ROUTES.admin.exports, icon: DocumentDownload, permission: "jobs.view.own" },
  { section: "Activité", label: "Notifications", href: ROUTES.admin.notifications, icon: Notification, permission: "dashboard.view", badge: "notifications" },
  { section: "Équipe", label: "Revendeurs", href: ROUTES.admin.resellers, icon: People, permission: "resellers.view" },
  { section: "Équipe", label: "Candidatures", href: ROUTES.admin.applications, icon: UserAdd, permission: "reseller_applications.review" },
  { section: "Équipe", label: "Commissions", resellerLabel: "Mes commissions", href: ROUTES.admin.commissions, icon: Wallet3, permission: "commissions.view.own" },
  { section: "Équipe", label: "Encaissements", resellerLabel: "Argent à reverser", href: ROUTES.admin.cash, icon: MoneyRecive, permission: "cash.view.own" },
  { section: "Équipe", label: "Cagnotte", href: ROUTES.admin.cagnotte, icon: Gift, permission: "cagnotte.pay" },
  { section: "Équipe", label: "Niveaux et sanctions", resellerLabel: "Mon niveau", href: ROUTES.admin.standing, icon: Award, permission: "standing.view.own" },
  { section: "Équipe", label: "Mes invités", href: ROUTES.admin.invites, icon: Share, permission: "commissions.view.own", onlyRoles: ["revendeur"] },
  { section: "Système", label: "Utilisateurs & rôles", href: ROUTES.admin.users, icon: Profile2User, permission: "users.manage" },
  { section: "Système", label: "Journal d'audit", href: ROUTES.admin.audit, icon: DocumentText, permission: "audit.view" },
  // zones de livraison : responsable et admin ; taux, coordonnées et horaires : admin seul (dans la page)
  { section: "Système", label: "Programmes de fidélité", href: ROUTES.admin.loyalty, icon: TicketStar, permission: "loyalty.manage" },
  { section: "Système", label: "Réglages du site", href: ROUTES.admin.settings, icon: Setting2, permission: "shipping.manage" },
];
