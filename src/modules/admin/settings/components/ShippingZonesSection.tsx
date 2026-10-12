"use client";

import { useState } from "react";
import { Add, ArrowDown2, ArrowUp2, Edit2, Trash, Truck } from "@/shared/ui/icons";
import { getErrorMessage } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Switch } from "@/shared/ui/Form";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { useDeleteZone, useMoveZone, usePatchZone, useShippingZonesAdmin } from "../hooks/useAdminSettings";
import type { AdminShippingZone } from "../types";
import { SettingsSection } from "./SettingsForm";
import { ZoneFormModal } from "./ZoneFormModal";

const iconBtn = "grid size-11 place-items-center rounded-full bg-chip text-ink-2 transition-colors hover:bg-primary hover:text-white disabled:opacity-40 disabled:hover:bg-chip disabled:hover:text-ink-2 sm:size-9";

/** Zones de livraison : villes, frais, seuil de gratuité, délai, ordre d'affichage (le premier zone apparaît en tête du guide). */
export function ShippingZonesSection() {
  const { data: zones, isLoading } = useShippingZonesAdmin();
  const [editing, setEditing] = useState<AdminShippingZone | "new" | null>(null);
  const [toDelete, setToDelete] = useState<AdminShippingZone | null>(null);
  const patch = usePatchZone();
  const move = useMoveZone();
  const del = useDeleteZone();
  const list = zones ?? [];
  const busy = patch.isPending || move.isPending;

  return (
    <>
      <SettingsSection
        title="Zones de livraison"
        hint="Le client voit les frais et le délai de sa ville avant de valider. L'ordre est celui du guide d'achat : placez Bukavu et Goma en premier."
        aside={<Button type="button" size="sm" upper={false} leftIcon={<Add size={16} />} onClick={() => setEditing("new")}>Nouvelle zone</Button>}
      >
        {isLoading ? (
          <div className="grid gap-2.5">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[92px] rounded-box!" />)}</div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<Truck size={44} variant="Bulk" />}
            title="Aucune zone de livraison"
            description="Sans zone, les frais affichés sont ceux par défaut. Créez Bukavu et Goma, leurs environs, puis une zone par défaut pour le reste du pays."
            action={<Button type="button" upper={false} leftIcon={<Add size={16} />} onClick={() => setEditing("new")}>Créer la première zone</Button>}
          />
        ) : (
          <ol className="grid gap-2.5">
            {list.map((z, i) => (
              <li key={z.id} className={cn("flex flex-col gap-3 rounded-box border border-line-3 p-4 sm:flex-row sm:items-center", !z.isActive && "bg-chip/60")}>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[15px] font-bold">
                    <span className="grid size-6 place-items-center rounded-full bg-primary-100 text-[12px] text-primary-dark">{i + 1}</span>
                    {z.name}
                    {z.isDefault && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-white">Par défaut</span>}
                    {!z.isActive && <span className="rounded-full bg-line-3 px-2 py-0.5 text-[10px] font-bold uppercase text-ink">Inactive</span>}
                  </p>
                  <p className="mt-1 text-[13px] leading-[19px] text-ink-2">{z.cities.length ? z.cities.join(", ") : z.isDefault ? "Toutes les autres villes" : "Aucune ville"}</p>
                  <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] tabular-nums">
                    <span><span className="text-ink-3">Frais </span><b>{z.fee === 0 ? "Offerte" : formatPrice(z.fee)}</b></span>
                    {z.freeThreshold != null && <span><span className="text-ink-3">Offerte dès </span><b>{formatPrice(z.freeThreshold)}</b></span>}
                    {z.deliveryEstimate && <span><span className="text-ink-3">Délai </span><b>{z.deliveryEstimate}</b></span>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Switch
                    label={z.isActive ? `Désactiver ${z.name}` : `Activer ${z.name}`}
                    checked={z.isActive}
                    onChange={(isActive) => patch.mutate({ id: z.id, patch: { isActive } }, { onError: (e) => toast.error("Modification impossible", getErrorMessage(e)) })}
                  />
                  <span className="mx-1 h-6 w-px bg-line-3" aria-hidden />
                  <button type="button" aria-label={`Monter ${z.name}`} disabled={i === 0 || busy} onClick={() => move.mutate({ zones: list, index: i, dir: -1 })} className={iconBtn}><ArrowUp2 size={16} /></button>
                  <button type="button" aria-label={`Descendre ${z.name}`} disabled={i === list.length - 1 || busy} onClick={() => move.mutate({ zones: list, index: i, dir: 1 })} className={iconBtn}><ArrowDown2 size={16} /></button>
                  <button type="button" aria-label={`Modifier ${z.name}`} onClick={() => setEditing(z)} className={iconBtn}><Edit2 size={16} /></button>
                  <button type="button" aria-label={`Supprimer ${z.name}`} onClick={() => setToDelete(z)} className={cn(iconBtn, "hover:bg-danger")}><Trash size={16} /></button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </SettingsSection>

      {editing && (
        <ZoneFormModal
          key={editing === "new" ? "new" : editing.id}
          zone={editing === "new" ? null : editing}
          nextPosition={list.length ? Math.max(...list.map((z) => z.position)) + 1 : 0}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() =>
          toDelete &&
          del.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success("Zone supprimée", toDelete.name);
              setToDelete(null);
            },
            onError: (e) => toast.error("Suppression impossible", getErrorMessage(e)),
          })
        }
        title="Supprimer cette zone ?"
        message={toDelete ? `Les clients de « ${toDelete.name} » se verront appliquer la zone par défaut. Pour suspendre temporairement, désactivez-la plutôt.` : ""}
        confirmLabel="Supprimer"
        loading={del.isPending}
        tone="danger"
      />
    </>
  );
}
