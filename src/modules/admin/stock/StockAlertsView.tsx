"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Warning2 } from "@/shared/ui/icons";
import { ENDPOINTS } from "@/config/endpoints";
import { ROUTES } from "@/config/routes";
import { Pill } from "@/shared/ui/Badges";
import { Block } from "@/shared/ui/Block";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { api } from "@/shared/lib/api";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { PageHeader } from "../ui/PageHeader";

interface LowStock {
  productId: number;
  variantId: number | null;
  name: string;
  variantLabel: string;
  stock: number;
  threshold: number;
}

function Content() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "stock-alerts"], queryFn: () => api.get<LowStock[]>(ENDPOINTS.admin.products.stockAlerts) });
  return (
    <>
      <PageHeader title="Alertes de stock" description="Les produits et variantes arrivés à leur seuil d'alerte (réglé sur chaque fiche produit). Réapprovisionnez-les ou ajustez le stock depuis la fiche." />
      <Block pad="none" className="overflow-hidden">
        {isLoading || !data ? (
          <Skeleton className="m-4 h-40 rounded-box!" />
        ) : data.length === 0 ? (
          <EmptyState icon={<Warning2 size={40} />} title="Aucune alerte" description="Tous les produits sont au-dessus de leur seuil." />
        ) : (
          <ul className="divide-y divide-line-3">
            {data.map((row) => (
              <li key={`${row.productId}-${row.variantId ?? 0}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[13px] sm:px-6">
                <Link href={ROUTES.admin.product(row.productId)} className="min-w-0 font-semibold text-primary hover:underline">
                  {row.name}{row.variantLabel ? ` — ${row.variantLabel}` : ""}
                </Link>
                <span className="flex items-center gap-2 text-ink-3">
                  seuil {row.threshold}
                  <Pill tone={row.stock === 0 ? "red" : "yellow"}>{row.stock === 0 ? "Rupture" : `${row.stock} en stock`}</Pill>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Block>
    </>
  );
}

export function StockAlertsView() {
  return (
    <PermissionGuard permission="products.manage">
      <Content />
    </PermissionGuard>
  );
}
