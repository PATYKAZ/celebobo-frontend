"use client";

import Image from "next/image";
import { useState } from "react";
import { Add, ArrowDown2, ArrowUp2, Edit2, Gallery, Trash } from "@/shared/ui/icons";
import { getErrorMessage } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Switch } from "@/shared/ui/Form";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { PageHeader } from "../../ui/PageHeader";
import { useAdminBanners, useDeleteBanner, useMoveBanner, usePatchBanner } from "../hooks/useAdminBanners";
import { bannerStatus, type AdminBanner, type BannerStatus } from "../types";
import { BannerFormModal } from "./BannerFormModal";

const iconBtn = "grid size-11 place-items-center rounded-full bg-chip text-ink-2 transition-colors hover:bg-primary hover:text-white disabled:opacity-40 disabled:hover:bg-chip disabled:hover:text-ink-2 sm:size-9";

const STATUS: Record<BannerStatus, { label: string; className: string }> = {
  live: { label: "En ligne", className: "bg-primary text-white" },
  scheduled: { label: "Programmée", className: "bg-sun text-ink" },
  expired: { label: "Terminée", className: "bg-line-3 text-ink-2" },
  off: { label: "Inactive", className: "bg-line-3 text-ink-2" },
};

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function period(b: AdminBanner) {
  if (!b.startsAt && !b.endsAt) return "Sans limite de dates";
  if (b.startsAt && b.endsAt) return `Du ${dateFmt.format(new Date(b.startsAt))} au ${dateFmt.format(new Date(b.endsAt))}`;
  return b.startsAt ? `À partir du ${dateFmt.format(new Date(b.startsAt))}` : `Jusqu’au ${dateFmt.format(new Date(b.endsAt as string))}`;
}

/** Bannières du carrousel de l'accueil : image, textes, destination, ordre et période d'affichage. */
export function BannersView() {
  return (
    <PermissionGuard permission="content.manage">
      <Content />
    </PermissionGuard>
  );
}

function Content() {
  const { data, isLoading, isError, error, refetch } = useAdminBanners();
  const [editing, setEditing] = useState<AdminBanner | "new" | null>(null);
  const [toDelete, setToDelete] = useState<AdminBanner | null>(null);
  const patch = usePatchBanner();
  const move = useMoveBanner();
  const del = useDeleteBanner();
  const list = data ?? [];
  const busy = patch.isPending || move.isPending;
  const live = list.filter((b) => bannerStatus(b) === "live").length;

  return (
    <>
      <PageHeader
        title="Bannières de l'accueil"
        description="Le grand carrousel en haut de la boutique. Seules les bannières en ligne s'affichent, dans cet ordre."
        actions={<Button upper={false} leftIcon={<Add size={18} />} onClick={() => setEditing("new")}>Nouvelle bannière</Button>}
      />

      {isLoading ? (
        <div role="status" aria-busy="true" className="grid gap-3">
          <span className="sr-only">Chargement des bannières…</span>
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[120px] rounded-box!" />)}
        </div>
      ) : isError ? (
        <Block className="text-center">
          <p className="text-[14px] text-ink-2">{getErrorMessage(error, "Impossible de charger les bannières.")}</p>
          <Button className="mt-4" variant="chip" upper={false} onClick={() => refetch()}>Réessayer</Button>
        </Block>
      ) : list.length === 0 ? (
        <Block>
          <EmptyState
            icon={<Gallery size={44} variant="Bulk" />}
            title="Aucune bannière"
            description="Sans bannière, l'accueil affiche les visuels par défaut du site."
            action={<Button upper={false} leftIcon={<Add size={16} />} onClick={() => setEditing("new")}>Créer la première bannière</Button>}
          />
        </Block>
      ) : (
        <Block pad="none" className="p-3 sm:p-5">
          <p className="mb-3 px-1 text-[13px] text-ink-2">{live} en ligne sur {list.length}</p>
          <ol className="grid gap-2.5">
            {list.map((b, i) => {
              const status = STATUS[bannerStatus(b)];
              return (
                <li key={b.id} className={cn("flex flex-col gap-3 rounded-box border border-line-3 p-3 sm:flex-row sm:items-center sm:p-4", status.label !== "En ligne" && "bg-chip/50")}>
                  <div className="relative aspect-45/16 w-full shrink-0 overflow-hidden rounded-md bg-page sm:w-[200px]">
                    {b.image && <Image src={b.image} alt="" fill sizes="(min-width:640px) 200px, 100vw" className="object-cover" />}
                    <span className="absolute left-2 top-2 grid size-6 place-items-center rounded-full bg-white text-[12px] font-bold text-primary-dark shadow-sm">{i + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="whitespace-pre-line text-[15px] font-bold leading-[19px]">{b.title}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", status.className)}>{status.label}</span>
                    </p>
                    {b.subtitle && <p className="mt-1 text-[13px] leading-[18px] text-ink-2">{b.subtitle}</p>}
                    <p className="mt-1.5 break-all text-[12px] text-ink-3">
                      {b.linkLabel || "Découvrir"} → {b.linkUrl || "aucun lien"} · {period(b)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Switch
                      label={b.isActive ? `Désactiver ${b.title}` : `Activer ${b.title}`}
                      checked={b.isActive}
                      onChange={(isActive) => patch.mutate({ id: b.id, patch: { isActive } }, { onError: (e) => toast.error("Modification impossible", getErrorMessage(e)) })}
                    />
                    <span className="mx-1 h-6 w-px bg-line-3" aria-hidden />
                    <button type="button" aria-label={`Monter ${b.title}`} disabled={i === 0 || busy} onClick={() => move.mutate({ banners: list, index: i, dir: -1 })} className={iconBtn}><ArrowUp2 size={16} /></button>
                    <button type="button" aria-label={`Descendre ${b.title}`} disabled={i === list.length - 1 || busy} onClick={() => move.mutate({ banners: list, index: i, dir: 1 })} className={iconBtn}><ArrowDown2 size={16} /></button>
                    <button type="button" aria-label={`Modifier ${b.title}`} onClick={() => setEditing(b)} className={iconBtn}><Edit2 size={16} /></button>
                    <button type="button" aria-label={`Supprimer ${b.title}`} onClick={() => setToDelete(b)} className={cn(iconBtn, "hover:bg-danger")}><Trash size={16} /></button>
                  </div>
                </li>
              );
            })}
          </ol>
        </Block>
      )}

      {editing && (
        <BannerFormModal
          key={editing === "new" ? "new" : editing.id}
          banner={editing === "new" ? null : editing}
          nextPosition={list.length ? Math.max(...list.map((b) => b.position)) + 1 : 0}
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
              toast.success("Bannière supprimée", toDelete.title);
              setToDelete(null);
            },
            onError: (e) => toast.error("Suppression impossible", getErrorMessage(e)),
          })
        }
        title="Supprimer cette bannière ?"
        message="Elle disparaît du carrousel. Pour la retirer temporairement, désactivez-la ou donnez-lui une date de fin."
        confirmLabel="Supprimer"
        loading={del.isPending}
        tone="danger"
      />
    </>
  );
}
