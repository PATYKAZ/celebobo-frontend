"use client";

import { useAuth } from "@/modules/auth/hooks/useAuth";
import { DashboardView } from "@/modules/admin/dashboard";
import { ResellerDashboardView } from "@/modules/admin/reseller-space";

/** Page d'accueil du back-office : le revendeur voit SON espace, responsable/admin le tableau de bord global. */
export function AdminHome() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "revendeur" ? <ResellerDashboardView /> : <DashboardView />;
}
