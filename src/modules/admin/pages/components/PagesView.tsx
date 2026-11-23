"use client";

import Link from "next/link";
import { useState } from "react";
import { Add, DocumentText, Edit2, Eye, Trash } from "@/shared/ui/icons";
import { ROUTES } from "@/config/routes";
import { getErrorMessage } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Switch } from "@/shared/ui/Form";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { PageHeader } from "../../ui/PageHeader";
import { useAdminPages, useDeletePage, usePublishPage } from "../hooks/useAdminPages";
import type { AdminPage } from "../services/admin-pages.service";
import { PageFormModal } from "./PageFormModal";

const iconBtn = "grid size-11 place-items-center rounded-full bg-chip text-ink-2 transition-colors hover:bg-primary hover:text-white sm:size-9";

/** Pages du site et politiques (livraison, garantie, fidélité, confidentialité, revendeurs). */
export function PagesView() {
  return (
    <PermissionGuard permission="content.manage">
      <Content />
    </PermissionGuard>
  );
}

function PageRow({ page, onEdit, onDelete }: { page: AdminPage; onEdit: () => void; onDelete: () => void }) {
  const publish = usePublishPage();
  const policy = !!(page.version || page.effectiveOn);
  return (
    <li className={cn("flex flex-col gap-3 rounded-box border border-line-3 p-3 sm:flex-row sm:items-center sm:p-4", !page.isPublished && "bg-chip/50")}>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold">{page.title}</span>
          {policy && <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-dark">Politique</span>}
          {!page.isPublished && <span className="rounded-full bg-line-3 px-2 py-0.5 text-xs font-bold text-ink">Brouillon</span>}
        </p>
        <p className="mt-1 text-xs text-ink-3">
          /pages/{page.slug}
          {page.version && <> · version {page.version}</>}
          {page.effectiveOn && <> · en vigueur le {formatDate(page.effectiveOn)}</>}
          {" · "}modifiée le {formatDate(page.updatedAt)}
        </p>
        {page.summary && <p className="mt-1 text-sm text-ink-2">{page.summary}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2 max-sm:justify-end">
        <Switch
          label={page.isPublished ? `Dépublier ${page.title}` : `Publier ${page.title}`}
          checked={page.isPublished}
          onChange={(isPublished) => publish.mutate({ id: page.id, isPublished }, { onError: (e) => toast.error("Modification impossible", getErrorMessage(e)) })}
        />
        <span className="mx-1 h-6 w-px bg-line-3" aria-hidden />
        <Link href={ROUTES.page(page.slug)} target="_blank" aria-label={`Voir ${page.title} sur le site`} className={iconBtn}><Eye size={16} /></Link>
        <button type="button" aria-label={`Modifier ${page.title}`} onClick={onEdit} className={iconBtn}><Edit2 size={16} /></button>
        <button type="button" aria-label={`Supprimer ${page.title}`} onClick={onDelete} className={cn(iconBtn, "hover:bg-danger")}><Trash size={16} /></button>
      </div>
    </li>
  );
}

function Content() {
  const { data, isLoading, isError, error, refetch } = useAdminPages();
  const [editing, setEditing] = useState<AdminPage | "new" | null>(null);
  const [toDelete, setToDelete] = useState<AdminPage | null>(null);
  const del = useDeletePage();
  const list = data ?? [];

  return (
    <>
      <PageHeader
        title="Pages et politiques"
        description="Les pages d'information du site et les politiques Celebobo. Quand une politique change, mettez à jour son texte, sa version et sa date d'entrée en vigueur."
        actions={<Button upper={false} leftIcon={<Add size={18} />} onClick={() => setEditing("new")}>Nouvelle page</Button>}
      />

      {isLoading ? (
        <div role="status" aria-busy="true" className="grid gap-3">
          <span className="sr-only">Chargement des pages…</span>
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[84px] rounded-box!" />)}
        </div>
      ) : isError ? (
        <Block className="text-center">
          <p className="text-sm text-ink-2">{getErrorMessage(error, "Impossible de charger les pages.")}</p>
          <Button className="mt-4" variant="secondary" upper={false} onClick={() => refetch()}>Réessayer</Button>
        </Block>
      ) : list.length === 0 ? (
        <Block>
          <EmptyState
            icon={<DocumentText size={44} variant="Bulk" />}
            title="Aucune page"
            description="Créez les pages d'information du site : à propos, conditions, politiques…"
            action={<Button upper={false} leftIcon={<Add size={16} />} onClick={() => setEditing("new")}>Créer une page</Button>}
          />
        </Block>
      ) : (
        <Block pad="none" className="p-3 sm:p-5">
          <ol className="grid gap-2.5">
            {list.map((p) => (
              <PageRow key={p.id} page={p} onEdit={() => setEditing(p)} onDelete={() => setToDelete(p)} />
            ))}
          </ol>
        </Block>
      )}

      {editing && <PageFormModal key={editing === "new" ? "new" : editing.id} page={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() =>
          toDelete &&
          del.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success("Page supprimée", toDelete.title);
              setToDelete(null);
            },
            onError: (e) => toast.error("Suppression impossible", getErrorMessage(e)),
          })
        }
        title="Supprimer cette page ?"
        message="Elle disparaît du site, et les liens vers elle ne fonctionneront plus. Pour la retirer sans l'effacer, dépubliez-la."
        confirmLabel="Supprimer"
        loading={del.isPending}
        tone="danger"
      />
    </>
  );
}
