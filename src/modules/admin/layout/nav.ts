import { Box, Chart2, Element3, Messages2, MoneyRecive, People, type Icon } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: Icon;
  /** true => actif uniquement sur l'URL exacte */
  exact?: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Tableau de bord", href: ROUTES.admin.root, icon: Element3, exact: true },
  { label: "Produits", href: ROUTES.admin.products, icon: Box },
  { label: "Ventes", href: ROUTES.admin.sales, icon: MoneyRecive },
  { label: "Commandes & discussions", href: ROUTES.admin.orders, icon: Messages2 },
  { label: "Analytique", href: ROUTES.admin.analytics, icon: Chart2 },
  { label: "Revendeurs", href: ROUTES.admin.resellers, icon: People },
];
