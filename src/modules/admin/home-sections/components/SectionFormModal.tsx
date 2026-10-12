"use client";

import { useState, type FormEvent } from "react";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Input, Select, Switch } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { toast } from "@/shared/ui/Toast";
import { useFlatCategories } from "@/modules/categories/hooks/useCategories";
import { categoryOptionLabel } from "@/modules/categories/services/categories.mapper";
import { useSaveSection } from "../hooks/useAdminHomeSections";
import { SECTION_KINDS, type HomeSection, type SectionFormValues } from "../types";

type Errors = Partial<Record<keyof SectionFormValues, string>>;

/** Création / modification d'un bloc catégorie. Monté seulement quand il est ouvert (`key` du parent). */
export function SectionFormModal({ section, onClose }: { section: HomeSection | null; onClose: () => void }) {
  const [v, setV] = useState<SectionFormValues>(() =>
    section ? { kind: section.kind, categoryId: section.categoryId, title: section.title, isActive: section.isActive } : { kind: "showcase", categoryId: null, title: "", isActive: true },
  );
  const [errors, setErrors] = useState<Errors>({});
  const { data: categories } = useFlatCategories();
  const save = useSaveSection(section);
  const category = categories?.find((c) => c.id === v.categoryId);
  const set = <K extends keyof SectionFormValues>(k: K, value: SectionFormValues[K]) => {
    setV((x) => ({ ...x, [k]: value }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!v.categoryId) return setErrors({ categoryId: "Choisissez une catégorie." });
    save.mutate(v, {
      onSuccess: () => {
        toast.success(section ? "Bloc mis à jour" : "Bloc ajouté", v.title.trim() || category?.name);
        onClose();
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 400) {
          const next: Errors = {};
          for (const [k, msg] of Object.entries(err.fieldErrors)) next[k as keyof Errors] = Array.isArray(msg) ? String(msg[0]) : String(msg);
          setErrors(next);
        }
        toast.error("Enregistrement impossible", getErrorMessage(err));
      },
    });
  };

  return (
    <Modal open onClose={onClose} title={section ? "Modifier le bloc" : "Nouveau bloc catégorie"} className="max-w-[560px]">
      <form onSubmit={submit} noValidate className="grid gap-4">
        <div className="grid gap-2">
          <p className="text-[13px] font-semibold">Présentation</p>
          <SegmentedControl aria-label="Présentation" value={v.kind} onChange={(k) => set("kind", k)} options={SECTION_KINDS} fullWidth size="sm" />
          <p className="text-[12px] leading-[17px] text-ink-3">{SECTION_KINDS.find((k) => k.value === v.kind)?.hint}</p>
        </div>
        <Select
          label="Catégorie"
          required
          value={v.categoryId ?? ""}
          onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)}
          error={errors.categoryId}
          hint={category ? `${category.productsCount} article${category.productsCount > 1 ? "s" : ""}${category.children.length ? `, ${category.children.length} sous-catégorie${category.children.length > 1 ? "s" : ""}` : ""}.` : "Seules les catégories visibles en boutique sont proposées."}
          options={[{ value: "", label: "Choisir une catégorie…" }, ...(categories ?? []).map((c) => ({ value: c.id, label: categoryOptionLabel(c) }))]}
        />
        <Input label="Titre" value={v.title} onChange={(e) => set("title", e.target.value)} maxLength={80} placeholder={category?.name ?? "Nom de la catégorie"} hint="Vide : nom de la catégorie." error={errors.title} />
        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-box border border-line px-4 active:bg-chip">
          <span className="text-[14px] font-semibold">Affiché sur l’accueil</span>
          <Switch label="Affiché sur l'accueil" checked={v.isActive} onChange={(x) => set("isActive", x)} />
        </label>
        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="chip" upper={false} onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={save.isPending} upper={false}>{section ? "Enregistrer" : "Ajouter le bloc"}</Button>
        </div>
      </form>
    </Modal>
  );
}
