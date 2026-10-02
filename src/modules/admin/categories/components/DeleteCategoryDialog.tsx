"use client";

import { useEffect, useState } from "react";
import { Danger } from "iconsax-reactjs";
import { getErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Select } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { toast } from "@/shared/ui/Toast";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { useDeleteCategory } from "../hooks/useAdminCategories";
import type { AdminCategory } from "../types";

interface Props {
  category: AdminCategory | null;
  all: AdminCategory[];
  onClose: () => void;
}

/** Suppression : directe si vide, sinon explication + réaffectation des produits vers une autre catégorie. */
export function DeleteCategoryDialog({ category, all, onClose }: Props) {
  const del = useDeleteCategory();
  const [moveTo, setMoveTo] = useState("");
  useEffect(() => setMoveTo(""), [category]);

  const done = (name: string) => {
    toast.success("Catégorie supprimée", name);
    onClose();
  };
  const fail = (e: unknown) => toast.error("Suppression impossible", getErrorMessage(e));

  if (!category) return null;
  if (category.productsCount === 0) {
    return (
      <ConfirmDialog
        open
        onClose={onClose}
        loading={del.isPending}
        title="Supprimer cette catégorie ?"
        message={`« ${category.name} » ne contient aucun produit. Elle sera supprimée.`}
        confirmLabel="Supprimer"
        onConfirm={() => del.mutate({ id: category.id }, { onSuccess: () => done(category.name), onError: fail })}
      />
    );
  }
  const others = all.filter((c) => c.id !== category.id);
  return (
    <Modal open onClose={onClose} className="max-w-[480px]">
      <div className="flex flex-col items-center text-center">
        <span className="grid size-14 place-items-center rounded-full bg-star/15 text-[#b87400] sm:size-16"><Danger size={30} variant="Bold" /></span>
        <h3 className="mt-3 text-[18px] leading-[26px] sm:mt-4 sm:text-[20px] sm:leading-[28px]">Cette catégorie n&apos;est pas vide</h3>
        <p className="mt-2 text-[14px] leading-[22px] text-ink-2">
          « {category.name} » contient <strong>{category.productsCount} produit{category.productsCount > 1 ? "s" : ""}</strong>. Pour la supprimer, réaffectez-les à une autre catégorie — ou désactivez-la pour la masquer simplement de la boutique.
        </p>
        <div className="mt-5 w-full text-left">
          <Select label="Réaffecter les produits vers" value={moveTo} onChange={(e) => setMoveTo(e.target.value)} options={[{ value: "", label: "Choisir une catégorie…" }, ...others.map((c) => ({ value: c.id, label: c.name }))]} />
        </div>
        <div className="mt-6 flex w-full flex-col-reverse gap-2.5 sm:grid sm:grid-cols-2 sm:gap-3">
          <Button variant="chip" upper={false} onClick={onClose}>Annuler</Button>
          <Button variant="danger" upper={false} disabled={!moveTo} loading={del.isPending} onClick={() => del.mutate({ id: category.id, moveTo: Number(moveTo) }, { onSuccess: () => done(category.name), onError: fail })}>
            Réaffecter et supprimer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
