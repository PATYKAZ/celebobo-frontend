"use client";

import Image from "next/image";
import { useState } from "react";
import { Add, Edit2, Flash, Trash } from "@/shared/ui/icons";
import { getErrorMessage } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Switch } from "@/shared/ui/Form";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { PageHeader } from "../../ui/PageHeader";
import { useAdminDeals, useDeleteDeal, usePatchDeal } from "../hooks/useAdminDeals";
import type { AdminDeal, DealStatus } from "../types";
import { DealFormModal } from "./DealFormModal";

const iconBtn = "grid size-11 place-items-center rounded-full bg-chip text-ink-2 transition-colors hover:bg-primary hover:text-white sm:size-9";

const STATUS: Record<DealStatus, { label: string; className: string }> = {
  live: { label: "En cours", className: "bg-primary text-white" },
  scheduled: { label: "Programmée", className: "bg-sun text-on-light" },
  ended: { label: "Terminée", className: "bg-line-3 text-ink" },
};

const FILTERS: { value: DealStatus | "all"; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "live", label: "En cours" },
  { value: "scheduled", label: "Programmées" },
  { value: "ended", label: "Terminées" },
];

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Offres du jour : produit à prix réduit sur une période, quantité limitée ou non, cadeau éventuel. */
export function DealsView() {
  return (
    <PermissionGuard permission="products.manage">
      <Content />
    </PermissionGuard>
  );
}

function DealRow({ deal, onEdit, onDelete }: { deal: AdminDeal; onEdit: () => void; onDelete: () => void }) {
  const patch = usePatchDeal();
  const status = STATUS[deal.status];
  const percent = deal.regularPrice > deal.dealPrice ? Math.round((1 - deal.dealPrice / deal.regularPrice) * 100) : 0;
  const pct = deal.quantity ? Math.min(100, Math.round((deal.sold / deal.quantity) * 100)) : 0;
  const name = deal.variantLabel ? `${deal.product.name} · ${deal.variantLabel}` : deal.product.name;

  return (
    <li className={cn("flex flex-col gap-3 rounded-box border border-line-3 p-3 sm:flex-row sm:items-center sm:p-4", deal.status !== "live" && "bg-chip/50")}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="relative size-16 shrink-0 overflow-hidden rounded-md bg-page sm:size-[72px]">
          {deal.product.image && <Image src={deal.product.image} alt="" fill sizes="72px" className="object-cover" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-bold leading-[19px]">{name}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", status.className)}>{status.label}</span>
            {!deal.isActive && <span className="rounded-full bg-line-3 px-2 py-0.5 text-[10px] font-bold uppercase text-ink">Désactivée</span>}
          </p>
          <p className="mt-1 text-[14px]">
            <strong className="text-primary">{formatPrice(deal.dealPrice)}</strong>
            <span className="ml-2 text-[12px] text-ink-3 line-through">{formatPrice(deal.regularPrice)}</span>
            {percent > 0 && <span className="ml-2 text-[12px] font-bold text-danger">−{percent} %</span>}
          </p>
          <p className="mt-1 text-[12px] text-ink-3">
            Du {dateFmt.format(new Date(deal.startsAt))} au {dateFmt.format(new Date(deal.endsAt))}
            {deal.giftLabel && <> · Cadeau : {deal.giftLabel}</>}
          </p>
          <div className="mt-2 max-w-[320px]">
            {deal.quantity != null ? (
              <>
                <div className="h-1.5 overflow-hidden rounded-full bg-page" role="progressbar" aria-label="Unités vendues" aria-valuemin={0} aria-valuemax={deal.quantity} aria-valuenow={deal.sold}>
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-[12px] text-ink-2">{deal.sold} vendu{deal.sold > 1 ? "s" : ""} sur {deal.quantity}</p>
              </>
            ) : (
              <p className="text-[12px] text-ink-2">{deal.sold} vendu{deal.sold > 1 ? "s" : ""} · sans limite de quantité</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 max-sm:justify-end">
        <Switch
          label={deal.isActive ? `Désactiver l'offre ${name}` : `Activer l'offre ${name}`}
          checked={deal.isActive}
          onChange={(isActive) => patch.mutate({ id: deal.id, isActive }, { onError: (e) => toast.error("Modification impossible", getErrorMessage(e)) })}
        />
        <span className="mx-1 h-6 w-px bg-line-3" aria-hidden />
        <button type="button" aria-label={`Modifier l'offre ${name}`} onClick={onEdit} className={iconBtn}><Edit2 size={16} /></button>
        <button type="button" aria-label={`Supprimer l'offre ${name}`} onClick={onDelete} className={cn(iconBtn, "hover:bg-danger")}><Trash size={16} /></button>
      </div>
    </li>
  );
}

function Content() {
  const [filter, setFilter] = useState<DealStatus | "all">("all");
  const { data, isLoading, isError, error, refetch } = useAdminDeals(filter === "all" ? undefined : filter);
  const [editing, setEditing] = useState<AdminDeal | "new" | null>(null);
  const [toDelete, setToDelete] = useState<AdminDeal | null>(null);
  const del = useDeleteDeal();
  const list = data ?? [];

  return (
    <>
      <PageHeader
        title="Offres du jour"
        description="Un produit à prix réduit sur une période, avec compte à rebours sur l'accueil. Le prix s'applique jusqu'au paiement."
        actions={<Button upper={false} leftIcon={<Add size={18} />} onClick={() => setEditing("new")}>Nouvelle offre</Button>}
      />

      <div className="no-scrollbar mb-3 overflow-x-auto">
        <SegmentedControl aria-label="Filtrer par statut" value={filter} onChange={setFilter} options={FILTERS} size="sm" />
      </div>

      {isLoading ? (
        <div role="status" aria-busy="true" className="grid gap-3">
          <span className="sr-only">Chargement des offres…</span>
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[110px] rounded-box!" />)}
        </div>
      ) : isError ? (
        <Block className="text-center">
          <p className="text-[14px] text-ink-2">{getErrorMessage(error, "Impossible de charger les offres.")}</p>
          <Button className="mt-4" variant="chip" upper={false} onClick={() => refetch()}>Réessayer</Button>
        </Block>
      ) : list.length === 0 ? (
        <Block>
          <EmptyState
            icon={<Flash size={44} variant="Bulk" />}
            title={filter === "all" ? "Aucune offre" : "Aucune offre dans cette liste"}
            description="Sans offre en cours, l'accueil met en avant la promotion la plus vendue, sans compte à rebours."
            action={<Button upper={false} leftIcon={<Add size={16} />} onClick={() => setEditing("new")}>Programmer une offre</Button>}
          />
        </Block>
      ) : (
        <Block pad="none" className="p-3 sm:p-5">
          <ol className="grid gap-2.5">
            {list.map((d) => (
              <DealRow key={d.id} deal={d} onEdit={() => setEditing(d)} onDelete={() => setToDelete(d)} />
            ))}
          </ol>
        </Block>
      )}

      {editing && <DealFormModal key={editing === "new" ? "new" : editing.id} deal={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() =>
          toDelete &&
          del.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success("Offre supprimée", toDelete.product.name);
              setToDelete(null);
            },
            onError: (e) => toast.error("Suppression impossible", getErrorMessage(e)),
          })
        }
        title="Supprimer cette offre ?"
        message="Le produit revient à son prix normal tout de suite. Pour l'arrêter sans l'effacer, désactivez-la."
        confirmLabel="Supprimer"
        loading={del.isPending}
        tone="danger"
      />
    </>
  );
}
