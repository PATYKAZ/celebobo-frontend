"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Add, ArrowDown2, ArrowUp2, Category2, Edit2, EyeSlash, Trash } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import { getErrorMessage } from "@/shared/lib/api";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Pill } from "@/shared/ui/Badges";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Switch } from "@/shared/ui/Form";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { CategoryIcon } from "@/modules/categories/components/CategoryIcon";
import { PermissionGuard, useCan } from "@/modules/auth/hooks/useCan";
import { PageHeader } from "../../ui/PageHeader";
import { StatCard } from "../../ui/StatCard";
import { useAdminCategories, useMoveCategory, useSetCategoryActive } from "../hooks/useAdminCategories";
import type { AdminCategory } from "../types";
import { CategoryFormModal } from "./CategoryFormModal";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";

function Content() {
  const { data, isLoading } = useAdminCategories();
  const move = useMoveCategory();
  const setActive = useSetCategoryActive();
  const canManage = useCan("categories.manage");
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);

  const list = data ?? [];
  const actives = list.filter((c) => c.active).length;
  const products = list.reduce((n, c) => n + c.productsCount, 0);

  const toggle = (c: AdminCategory, active: boolean) =>
    setActive.mutate({ id: c.id, active }, { onSuccess: () => toast.info(active ? "Catégorie visible" : "Catégorie masquée", c.name), onError: (e) => toast.error("Action impossible", getErrorMessage(e)) });

  return (
    <>
      <PageHeader
        title="Catégories"
        description="Organisez le catalogue : nom, image, ordre d'affichage et visibilité en boutique."
        actions={canManage && <Button onClick={() => setCreating(true)} leftIcon={<Add size={18} />}>Nouvelle catégorie</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Catégories" value={list.length} icon={<Category2 size={22} variant="Bold" />} />
        <StatCard label="Visibles en boutique" value={actives} icon={<Category2 size={22} variant="Bold" />} tone="blue" delay={0.05} />
        <StatCard label="Produits classés" value={products} icon={<Category2 size={22} variant="Bold" />} tone="orange" delay={0.1} />
      </div>

      <Block pad="none" className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[84px] w-full" />)}</div>
        ) : list.length === 0 ? (
          <EmptyState icon={<Category2 size={38} variant="Bulk" />} title="Aucune catégorie" description="Créez votre première catégorie pour organiser le catalogue." action={canManage ? <Button onClick={() => setCreating(true)}>Créer une catégorie</Button> : undefined} />
        ) : (
          <ul>
            <AnimatePresence initial={false}>
              {list.map((c, i) => (
                <motion.li
                  key={c.id}
                  layout
                  transition={{ type: "spring", stiffness: 420, damping: 38 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className={cn("flex items-center gap-3 border-b border-line-3/70 p-4 last:border-0 sm:gap-4 sm:px-5", !c.active && "bg-page/40")}
                >
                  {canManage && (
                    <div className="flex flex-col">
                      <button aria-label="Monter" disabled={i === 0 || move.isPending} onClick={() => move.mutate({ id: c.id, dir: "up" })} className="grid size-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-chip hover:text-primary disabled:opacity-30"><ArrowUp2 size={16} variant="Bold" /></button>
                      <button aria-label="Descendre" disabled={i === list.length - 1 || move.isPending} onClick={() => move.mutate({ id: c.id, dir: "down" })} className="grid size-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-chip hover:text-primary disabled:opacity-30"><ArrowDown2 size={16} variant="Bold" /></button>
                    </div>
                  )}
                  <span className="hidden w-6 text-center text-[13px] font-bold tabular-nums text-ink-3 sm:block">{c.order}</span>
                  <span className={cn("relative size-16 shrink-0 overflow-hidden rounded-box bg-page transition-opacity", !c.active && "opacity-50 grayscale")}>
                    {c.image && <Image src={c.image} alt="" fill sizes="64px" className="object-cover" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[15px] font-bold">
                      <CategoryIcon name={c.icon} size={17} className="shrink-0 text-primary" />
                      <span className="truncate">{c.name}</span>
                      {!c.active && <EyeSlash size={15} className="shrink-0 text-ink-3" />}
                    </p>
                    <p className="line-clamp-1 text-[13px] text-ink-2">{c.description || "—"}</p>
                  </div>
                  <Pill tone={c.productsCount ? "green" : "gray"} className="hidden sm:inline-flex">{c.productsCount} produit{c.productsCount > 1 ? "s" : ""}</Pill>
                  {canManage ? (
                    <>
                      <Switch label={`${c.name} visible`} checked={c.active} onChange={(a) => toggle(c, a)} />
                      <div className="flex gap-1.5">
                        <button onClick={() => setEditing(c)} aria-label="Modifier" title="Modifier" className="grid size-9 place-items-center rounded-full bg-chip transition-colors hover:bg-primary hover:text-white"><Edit2 size={17} /></button>
                        <button onClick={() => setDeleting(c)} aria-label="Supprimer" title="Supprimer" className="grid size-9 place-items-center rounded-full bg-chip transition-colors hover:bg-danger hover:text-white"><Trash size={17} /></button>
                      </div>
                    </>
                  ) : (
                    <Pill tone={c.active ? "green" : "gray"}>{c.active ? "Visible" : "Masquée"}</Pill>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Block>

      <CategoryFormModal open={creating || !!editing} category={editing} existingNames={list.map((c) => c.name)} onClose={() => { setCreating(false); setEditing(null); }} />
      <DeleteCategoryDialog category={deleting} all={list} onClose={() => setDeleting(null)} />
    </>
  );
}

export function CategoriesView() {
  return (
    <PermissionGuard permission="categories.manage">
      <Content />
    </PermissionGuard>
  );
}
