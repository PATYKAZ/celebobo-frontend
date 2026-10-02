"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Input, Switch, Textarea } from "@/shared/ui/Form";
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
  existingNames: string[];
  onClose: () => void;
}

export function CategoryFormModal({ open, category, existingNames, onClose }: Props) {
  const save = useSaveCategory(category?.id ?? null);
  const [v, setV] = useState<CategoryFormValues>(EMPTY_CATEGORY_FORM);
  const [image, setImage] = useState<CategoryImageValue>({ url: null });
  const [errors, setErrors] = useState<{ name?: string; image?: string }>({});

  useEffect(() => {
    if (!open) return;
    setV(category ? { name: category.name, description: category.description ?? "", icon: category.icon ?? "Mobile", active: category.active } : EMPTY_CATEGORY_FORM);
    setImage({ url: category?.image ?? null });
    setErrors({});
  }, [open, category]);

  const submit = () => {
    const name = v.name.trim();
    const e: typeof errors = {};
    if (!name) e.name = "Le nom est requis.";
    else if (existingNames.some((n) => n.trim().toLowerCase() === name.toLowerCase() && n !== category?.name)) e.name = "Une catégorie porte déjà ce nom.";
    if (!image.url) e.image = "Ajoutez une image.";
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
          if (err instanceof ApiError && err.status === 400 && err.fieldErrors.name) setErrors({ name: String(Array.isArray(err.fieldErrors.name) ? err.fieldErrors.name[0] : err.fieldErrors.name) });
          else toast.error("Enregistrement impossible", getErrorMessage(err));
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={category ? "Modifier la catégorie" : "Nouvelle catégorie"} className="max-w-[560px]">
      <div className="grid gap-4">
        <Input label="Nom" required value={v.name} onChange={(e) => { setV({ ...v, name: e.target.value }); setErrors((x) => ({ ...x, name: undefined })); }} error={errors.name} placeholder="Ex : Smartphones" />
        <Textarea label="Description" className="min-h-[80px]" value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
        <div className="grid items-start gap-4 sm:grid-cols-[170px_1fr]">
          <ImageSlot label="Image" main value={image} error={errors.image} onChange={(x) => { setImage(x); setErrors((e) => ({ ...e, image: undefined })); }} />
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
                  className={cn("grid aspect-square place-items-center rounded-box border transition-all", v.icon === ic ? "scale-105 border-primary bg-primary text-white" : "border-line bg-white hover:border-primary hover:text-primary")}
                >
                  <CategoryIcon name={ic} size={20} variant={v.icon === ic ? "Bold" : "Linear"} />
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-box border border-line px-4 py-3">
              <span className="text-[14px] font-semibold">Visible en boutique</span>
              <Switch label="Visible en boutique" checked={v.active} onChange={(a) => setV({ ...v, active: a })} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="chip" upper={false} onClick={onClose}>Annuler</Button>
          <Button upper={false} onClick={submit} loading={save.isPending}>{category ? "Enregistrer" : "Créer"}</Button>
        </div>
      </div>
    </Modal>
  );
}
