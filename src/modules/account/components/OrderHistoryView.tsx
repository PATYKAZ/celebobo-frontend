"use client";

import { Bag2 } from "iconsax-reactjs";
import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { RevealGroup, RevealItem } from "@/shared/animations/Reveal";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Pagination } from "@/shared/ui/Pagination";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Tabs } from "@/shared/ui/Tabs";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { OrderCard } from "@/modules/orders/components/OrderCard";
import { useOrders } from "@/modules/orders/hooks/useOrders";
import type { OrderStatus } from "@/modules/orders/types";

type Filter = "all" | "attente" | "cours" | "livree" | "fermee";
const PAGE_SIZE = 5;

/** Regroupement des 8 statuts en 4 onglets (le filtrage fin se fait dans le détail / côté API). */
const GROUPS: Record<Exclude<Filter, "all">, OrderStatus[]> = {
  attente: ["attente"],
  cours: ["assignee", "confirmee", "payee", "en_livraison"],
  livree: ["livree"],
  fermee: ["annulee", "retournee"],
};

function Content() {
  const [status, setStatus] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useOrders({ status: "all", page: 1, pageSize: 200 });
  const filtered = (data?.results ?? []).filter((o) => status === "all" || GROUPS[status].includes(o.status));
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const countOf = (f: Filter) => (data?.results ?? []).filter((o) => f === "all" || GROUPS[f].includes(o.status)).length;

  return (
    <Block>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-h-page text-primary">Mes commandes</h1>
          <p className="mt-1 text-[14px] text-ink-2">Suivez l&apos;avancement de vos commandes et échangez avec votre revendeur.</p>
        </div>
        <Tabs
          variant="pill"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          tabs={[
            { value: "all", label: "Toutes", count: countOf("all") },
            { value: "attente", label: "En attente", count: countOf("attente") },
            { value: "cours", label: "En cours", count: countOf("cours") },
            { value: "livree", label: "Livrées", count: countOf("livree") },
            { value: "fermee", label: "Annulées / retours", count: countOf("fermee") },
          ]}
        />
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[92px] w-full !rounded-box" />)
        ) : isError ? (
          <EmptyState icon={<Bag2 size={44} />} title="Chargement impossible" description="Une erreur est survenue lors de la récupération de vos commandes." action={<Button onClick={() => refetch()}>Réessayer</Button>} />
        ) : rows.length > 0 ? (
          <RevealGroup key={`${status}-${page}`} stagger={0.07} className="space-y-4">
            {rows.map((o, i) => (
              <RevealItem key={o.id}>
                <OrderCard order={o} defaultOpen={i === 0 && page === 1 && status === "all"} />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <EmptyState
            icon={<Bag2 size={44} variant="Bulk" />}
            title="Aucune commande"
            description={status === "all" ? "Vous n'avez pas encore passé de commande." : "Aucune commande ne correspond à ce statut."}
            action={<Button href={ROUTES.products}>Découvrir la boutique</Button>}
          />
        )}
      </div>
      <Pagination page={page} pageCount={pageCount} onChange={setPage} className="mt-8" />
    </Block>
  );
}

export function OrderHistoryView() {
  return (
    <>
      <Breadcrumb items={[{ label: "Mon compte" }, { label: "Commandes" }]} />
      <AuthGuard>
        <Content />
      </AuthGuard>
    </>
  );
}
