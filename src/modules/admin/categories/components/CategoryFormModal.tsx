"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Input, Select, Switch, Textarea } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { toast } from "@/shared/ui/Toast";
import { CategoryIcon } from "@/modules/categories/components/CategoryIcon";
import { ImageSlot } from "../../products/components/ImageSlot";
import { useSaveCategory } from "../hooks/useAdminCategories";
import { CATEGORY_ICONS, EMPTY_CATEGORY_FORM, type AdminCategory, type CategoryFormValues, type CategoryImageValue } from "../types";

interface Props {
  open: boolean;
  /** null = création */
  category: AdminCategory | null;
  /** toutes les catégories (noms déjà pris, parents possibles) */
  all: AdminCategory[];
  onClose: () => void;
}

export function CategoryFormModal({ open, category, all, onClose }: Props) {
  const save = useSaveCategory(category?.id ?? null);
  const [v, setV] = useState<CategoryFormValues>(EMPTY_CATEGORY_FORM);
  const [image, setImage] = useState<CategoryImageValue>({ url: null });
  const [errors, setErrors] = useState<{ name?: string; image?: string; parentId?: string }>({});
  const existingNames = all.map((c) => c.name);
  // deux niveaux au plus : une catégorie qui a des sous-catégories reste principale
  const hasChildren = !!category && all.some((c) => c.parentId === category.id);
  const parents = all.filter((c) => c.parentId == null && c.id !== category?.id);

  useEffect(() => {
    if (!open) return;
    setV(category ? { name: category.name, description: category.description ?? "", icon: category.icon?.toLowerCase() ?? "mobile", active: category.active, parentId: category.parentId, seoTitle: category.seoTitle ?? "", seoDescription: category.seoDescription ?? "" } : EMPTY_CATEGORY_FORM);
    setImage({ url: category?.image ?? null });
    setErrors({});
  }, [open, category]);

  const submit = () => {
    const name = v.name.trim();
    const e: typeof errors = {};
    if (!name) e.name = "Le nom est requis.";
    else if (existingNames.some((n) => n.trim().toLowerCase() === name.toLowerCase() && n !== category?.name)) e.name = "Une catégorie porte déjà ce nom.";
    // image exigée à la création ; une catégorie existante sans image reste modifiable
    if (!image.url && !category) e.image = "Ajoutez une image.";
    setErrors(e);
    if (Object.keys(e).length) return;
    save.mutate(
      { values: { ...v, name }, image },
      {
        onSuccess: () => {
          toast.success(category ? "Catégorie mise à jour" : "Catégorie créée", name);
          onClose();
        },
        onError: (err) => {
          const first = (x: unknown) => (x == null ? undefined : String(Array.isArray(x) ? x[0] : x));
          if (err instanceof ApiError && err.status === 400 && (err.fieldErrors.name || err.fieldErrors.parentId)) setErrors({ name: first(err.fieldErrors.name), parentId: first(err.fieldErrors.parentId) });
          else toast.error("Enregistrement impossible", getErrorMessage(err));
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={category ? "Modifier la catégorie" : "Nouvelle catégorie"} className="max-w-[560px]">
      <div className="grid gap-4">
        <Input label="Nom" required value={v.name} onChange={(e) => { setV({ ...v, name: e.target.value }); setErrors((x) => ({ ...x, name: undefined })); }} error={errors.name} placeholder="Ex : Smartphones" />
        <Select
          label="Catégorie parente"
          value={v.parentId ?? ""}
          disabled={hasChildren}
          onChange={(e) => { setV({ ...v, parentId: e.target.value ? Number(e.target.value) : null }); setErrors((x) => ({ ...x, parentId: undefined })); }}
          hint={hasChildren ? "Elle a des sous-catégories : elle reste une catégorie principale." : v.parentId ? "Sous-catégorie : ses produits comptent aussi dans la catégorie parente." : "Aucune : catégorie principale, affichée dans le menu."}
          error={errors.parentId}
          options={[{ value: "", label: "Aucune (catégorie principale)" }, ...parents.map((c) => ({ value: c.id, label: c.name }))]}
        />
        <Textarea label="Description" className="min-h-[80px]" value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
        {/* limites du modèle Django ; vides → nom et description (cf. categoryMetadata) */}
        <Input label="Titre SEO" maxLength={70} value={v.seoTitle} onChange={(e) => setV({ ...v, seoTitle: e.target.value })} placeholder={v.name ? `${v.name} — achat en ligne` : "Facultatif"} hint={`Affiché par Google · ${v.seoTitle.length}/70`} />
        <Textarea label="Description SEO" maxLength={160} className="min-h-[64px]" value={v.seoDescription} onChange={(e) => setV({ ...v, seoDescription: e.target.value })} placeholder={v.description || "Facultatif"} hint={`${v.seoDescription.length}/160 caractères`} />
        <div className="grid items-start gap-4 sm:grid-cols-[170px_1fr]">
          <div className="w-40 sm:w-auto"><ImageSlot label="Image" main value={image} error={errors.image} onChange={(x) => { setImage(x); setErrors((e) => ({ ...e, image: undefined })); }} /></div>
          <div>
            <p className="mb-1.5 text-[13px] font-semibold">Icône (menu boutique)</p>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORY_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  aria-label={ic}
                  aria-pressed={v.icon === ic}
                  onClick={() => setV({ ...v, icon: ic })}
                  className={cn("grid aspect-square place-items-center rounded-box border transition-all", v.icon === ic ? "scale-105 border-primary bg-primary text-white" : "border-line bg-surface hover:border-primary hover:text-primary")}
                >
                  <CategoryIcon name={ic} size={20} variant={v.icon === ic ? "Bold" : "Linear"} />
                </button>
              ))}
            </div>
            <label className="mt-4 flex min-h-14 cursor-pointer items-center justify-between rounded-box border border-line px-4 py-3 active:bg-chip">
              <span className="text-[14px] font-semibold">Visible en boutique</span>
              <Switch label="Visible en boutique" checked={v.active} onChange={(a) => setV({ ...v, active: a })} />
            </label>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_1.5fr] gap-3 sm:grid-cols-2">
          <Button variant="chip" upper={false} onClick={onClose}>Annuler</Button>
          <Button upper={false} onClick={submit} loading={save.isPending}>{category ? "Enregistrer" : "Créer"}</Button>
        </div>
      </div>
    </Modal>
  );
}
