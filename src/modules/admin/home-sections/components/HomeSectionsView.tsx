"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Add, ArrowDown2, ArrowUp2, Edit2, RowVertical, Trash } from "@/shared/ui/icons";
import { ROUTES } from "@/config/routes";
import { getErrorMessage } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Switch } from "@/shared/ui/Form";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { useFlatCategories } from "@/modules/categories/hooks/useCategories";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { PageHeader } from "../../ui/PageHeader";
import { useAdminHomeSections, useDeleteSection, useMoveSection, useSetSectionActive } from "../hooks/useAdminHomeSections";
import type { HomeSection } from "../types";
import { SectionFormModal } from "./SectionFormModal";

const iconBtn = "grid size-11 place-items-center rounded-full bg-chip text-ink-2 transition-colors hover:bg-primary hover:text-white disabled:opacity-40 disabled:hover:bg-chip disabled:hover:text-ink-2 sm:size-9";

/** Blocs catégorie de l'accueil : quelles catégories, présentées comment, dans quel ordre. */
export function HomeSectionsView() {
  return (
    <PermissionGuard permission="content.manage">
      <Content />
    </PermissionGuard>
  );
}

function Content() {
  const { data, isLoading, isError, error, refetch } = useAdminHomeSections();
  const { data: categories } = useFlatCategories();
  const [editing, setEditing] = useState<HomeSection | "new" | null>(null);
  const [toDelete, setToDelete] = useState<HomeSection | null>(null);
  const setActive = useSetSectionActive();
  const move = useMoveSection();
  const del = useDeleteSection();
  const list = data ?? [];
  const busy = setActive.isPending || move.isPending;
  const categoryOf = (s: HomeSection) => categories?.find((c) => c.id === s.categoryId);
  const nameOf = (s: HomeSection) => s.title || categoryOf(s)?.name || "Catégorie masquée";

  return (
    <>
      <PageHeader
        title="Blocs de l'accueil"
        description="Les catégories mises en avant en bas de l'accueil, en grand bloc ou en colonne, dans cet ordre. Sans bloc, l'accueil garde sa présentation par défaut."
        actions={<Button upper={false} leftIcon={<Add size={18} />} onClick={() => setEditing("new")}>Nouveau bloc</Button>}
      />

      {isLoading ? (
        <div role="status" aria-busy="true" className="grid gap-3">
          <span className="sr-only">Chargement des blocs…</span>
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[92px] rounded-box!" />)}
        </div>
      ) : isError ? (
        <Block className="text-center">
          <p className="text-[14px] text-ink-2">{getErrorMessage(error, "Impossible de charger les blocs.")}</p>
          <Button className="mt-4" variant="chip" upper={false} onClick={() => refetch()}>Réessayer</Button>
        </Block>
      ) : list.length === 0 ? (
        <Block>
          <EmptyState
            icon={<RowVertical size={44} variant="Bulk" />}
            title="Aucun bloc"
            description="L'accueil affiche ses blocs par défaut (smartphones, ordinateurs, puis audio, gaming et montres en colonnes). Ajoutez un bloc pour choisir vous-même."
            action={<Button upper={false} leftIcon={<Add size={16} />} onClick={() => setEditing("new")}>Ajouter un bloc</Button>}
          />
        </Block>
      ) : (
        <Block pad="none" className="p-3 sm:p-5">
          <ol className="grid gap-2.5">
            {list.map((s, i) => {
              const category = categoryOf(s);
              return (
                <li key={s.id} className={cn("flex flex-col gap-3 rounded-box border border-line-3 p-3 sm:flex-row sm:items-center sm:p-4", !s.isActive && "bg-chip/50")}>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-50 text-[12px] font-bold text-primary-dark">{i + 1}</span>
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-page">
                      {category?.image && <Image src={category.image} alt="" fill sizes="56px" className="object-cover" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-bold leading-[19px]">{nameOf(s)}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", s.kind === "showcase" ? "bg-primary text-white" : "bg-sun text-ink")}>{s.kind === "showcase" ? "Grand bloc" : "Colonne"}</span>
                        {!s.isActive && <span className="rounded-full bg-line-3 px-2 py-0.5 text-[10px] font-bold uppercase text-ink-2">Masqué</span>}
                      </p>
                      <p className="mt-1 text-[12px] text-ink-3">
                        {category ? (
                          <>
                            {category.parent ? `${category.parent.name} › ` : ""}
                            {category.name} · {category.productsCount} article{category.productsCount > 1 ? "s" : ""}
                            {category.children.length > 0 && ` · ${category.children.length} sous-catégorie${category.children.length > 1 ? "s" : ""}`}
                          </>
                        ) : (
                          "Catégorie masquée en boutique : ce bloc ne s'affiche pas."
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 max-sm:justify-end">
                    <Switch
                      label={s.isActive ? `Masquer ${nameOf(s)}` : `Afficher ${nameOf(s)}`}
                      checked={s.isActive}
                      onChange={(isActive) => setActive.mutate({ id: s.id, isActive }, { onError: (e) => toast.error("Modification impossible", getErrorMessage(e)) })}
                    />
                    <span className="mx-1 h-6 w-px bg-line-3" aria-hidden />
                    <button type="button" aria-label={`Monter ${nameOf(s)}`} disabled={i === 0 || busy} onClick={() => move.mutate({ sections: list, index: i, dir: -1 })} className={iconBtn}><ArrowUp2 size={16} /></button>
                    <button type="button" aria-label={`Descendre ${nameOf(s)}`} disabled={i === list.length - 1 || busy} onClick={() => move.mutate({ sections: list, index: i, dir: 1 })} className={iconBtn}><ArrowDown2 size={16} /></button>
                    <button type="button" aria-label={`Modifier ${nameOf(s)}`} onClick={() => setEditing(s)} className={iconBtn}><Edit2 size={16} /></button>
                    <button type="button" aria-label={`Supprimer ${nameOf(s)}`} onClick={() => setToDelete(s)} className={cn(iconBtn, "hover:bg-danger")}><Trash size={16} /></button>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 px-1 text-[12px] leading-[17px] text-ink-3">
            Les colonnes qui se suivent partagent une rangée (3 au plus par ligne sur ordinateur). Le visuel de chaque bloc se choisit dans{" "}
            <Link href={ROUTES.admin.banners} className="font-semibold text-primary hover:underline">Bannières de l’accueil</Link> ; sans bannière, le produit le plus vendu ou l’image de la catégorie s’affiche.
          </p>
        </Block>
      )}

      {editing && <SectionFormModal key={editing === "new" ? "new" : editing.id} section={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() =>
          toDelete &&
          del.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success("Bloc supprimé", nameOf(toDelete));
              setToDelete(null);
            },
            onError: (e) => toast.error("Suppression impossible", getErrorMessage(e)),
          })
        }
        title="Supprimer ce bloc ?"
        message="La catégorie n'est plus mise en avant sur l'accueil. Pour la retirer temporairement, masquez le bloc."
        confirmLabel="Supprimer"
        loading={del.isPending}
        tone="danger"
      />
    </>
  );
}
