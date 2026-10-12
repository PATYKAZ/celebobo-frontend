"use client";

import { useRef, useState, type FormEvent } from "react";
import { Gallery, Trash } from "@/shared/ui/icons";
import { ApiError, getErrorMessage, sendUpload } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Input, Select, Switch, Textarea } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { toast } from "@/shared/ui/Toast";
import { useFlatCategories } from "@/modules/categories/hooks/useCategories";
import { categoryOptionLabel } from "@/modules/categories/services/categories.mapper";
import { ProductCombobox } from "../../sales/components/ProductCombobox";
import { useSaveBanner } from "../hooks/useAdminBanners";
import { BANNER_PAGES, bannerToForm, buildLink } from "../services/admin-banners.service";
import { emptyBanner, type AdminBanner, type BannerFormValues, type BannerImageValue, type BannerLinkKind, type BannerSlot, type BannerTone } from "../types";

type Errors = Partial<Record<keyof BannerFormValues | "image", string>>;

const TONES: { value: BannerTone; label: string }[] = [
  { value: "dark", label: "Sombre · texte blanc" },
  { value: "light", label: "Claire · texte foncé" },
];

const LINK_KINDS: { value: BannerLinkKind; label: string }[] = [
  { value: "product", label: "Produit" },
  { value: "category", label: "Catégorie" },
  { value: "page", label: "Page" },
  { value: "url", label: "Lien" },
];

function validate(v: BannerFormValues, image: BannerImageValue): Errors {
  const e: Errors = {};
  if (!v.title.trim()) e.title = "Le titre est requis.";
  if (!image.url) e.image = "Ajoutez une image.";
  if (v.linkKind === "product") {
    if (!v.productId) e.linkTarget = "Choisissez un produit.";
  } else if (!v.linkTarget.trim()) e.linkTarget = "Choisissez où mène le bouton.";
  else if (v.linkKind === "url" && !/^(\/|https?:\/\/)\S+$/.test(v.linkTarget.trim())) e.linkTarget = "Adresse commençant par / ou https://";
  if (v.startsAt && v.endsAt && v.endsAt <= v.startsAt) e.endsAt = "La fin doit suivre le début.";
  return e;
}

/** Image de la bannière : aperçu au format du carrousel, envoi à Cloudinary dès le choix. */
function BannerImage({ value, onChange, error, slot }: { value: BannerImageValue; onChange: (v: BannerImageValue) => void; error?: string; slot?: BannerSlot }) {
  const input = useRef<HTMLInputElement>(null);
  const take = (file?: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (value.url?.startsWith("blob:")) URL.revokeObjectURL(value.url);
    const upload = sendUpload(file, "banner");
    upload.catch(() => undefined); // retenté à l'enregistrement
    onChange({ file, url: URL.createObjectURL(file), upload });
  };
  return (
    <div>
      <p className="mb-1.5 text-[13px] font-semibold">Image<span className="ml-0.5 text-danger">*</span></p>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          take(e.dataTransfer.files?.[0]);
        }}
        aria-label="Choisir l'image de la bannière"
        className={cn("group relative grid w-full place-items-center", slot?.aspect ?? "aspect-45/16", " overflow-hidden rounded-box border-2 border-dashed transition-colors", error ? "border-danger bg-danger-50" : "border-line bg-page/40 hover:border-primary")}
      >
        {value.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.url} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 px-3 text-center text-[12px] text-ink-3 group-hover:text-primary">
            <Gallery size={30} variant="Bulk" />
            Photo sans texte incrusté, {slot?.size ?? "1800 × 640 px"} conseillé
          </span>
        )}
      </button>
      {value.url && (
        <button type="button" onClick={() => onChange({ url: null })} className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-danger">
          <Trash size={14} /> Retirer l’image
        </button>
      )}
      <p className="mt-1 text-[12px] leading-[17px] text-ink-3">Le titre et le bouton s’affichent par-dessus : évitez une image qui contient déjà du texte.</p>
      {error && <p role="alert" className="mt-1 text-[12px] text-danger">{error}</p>}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}

/** Création / modification d'une bannière. Monté seulement quand il est ouvert (`key` du parent). */
export function BannerFormModal({ banner, placement, slots, nextPosition, onClose }: { banner: AdminBanner | null; placement: string; slots: BannerSlot[]; nextPosition: (placement: string) => number; onClose: () => void }) {
  const [v, setV] = useState<BannerFormValues>(() => (banner ? bannerToForm(banner) : emptyBanner(placement)));
  const [image, setImage] = useState<BannerImageValue>({ url: banner?.image ?? null });
  const [errors, setErrors] = useState<Errors>({});
  const { data: categories } = useFlatCategories();
  const save = useSaveBanner(banner, nextPosition);
  const set = <K extends keyof BannerFormValues>(k: K, value: BannerFormValues[K]) => {
    setV((x) => ({ ...x, [k]: value }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const setKind = (kind: BannerLinkKind) => {
    setV((x) => ({ ...x, linkKind: kind, linkTarget: "", productId: null, productName: "" }));
    setErrors((e) => ({ ...e, linkTarget: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(v, image);
    setErrors(found);
    if (Object.keys(found).length) return;
    save.mutate(
      { values: v, image },
      {
        onSuccess: (b) => {
          toast.success(banner ? "Bannière mise à jour" : "Bannière créée", b.title);
          onClose();
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 400) {
            const next: Errors = {};
            for (const [k, msg] of Object.entries(err.fieldErrors)) {
              const key = (k === "linkUrl" || k === "productId" ? "linkTarget" : k) as keyof Errors;
              next[key] = Array.isArray(msg) ? String(msg[0]) : String(msg);
            }
            setErrors(next);
          }
          toast.error("Enregistrement impossible", getErrorMessage(err));
        },
      },
    );
  };

  const link = buildLink(v.linkKind, v.linkTarget);
  const slot = slots.find((x) => x.value === v.placement);

  return (
    <Modal open onClose={onClose} title={banner ? "Modifier la bannière" : "Nouvelle bannière"} className="max-w-[640px]">
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Select
          label="Emplacement"
          required
          value={v.placement}
          onChange={(e) => set("placement", e.target.value)}
          hint={slot ? `${slot.where}${slot.shown ? ` ${slot.shown === 1 ? "Seule la première bannière en ligne s'affiche." : `Les ${slot.shown} premières en ligne s'affichent.`}` : ""}` : undefined}
          error={errors.placement}
          options={slots.map((x) => ({ value: x.value, label: x.label }))}
        />
        <BannerImage value={image} onChange={(x) => { setImage(x); setErrors((e) => ({ ...e, image: undefined })); }} error={errors.image} slot={slot} />
        <div className="grid gap-2">
          <p className="text-[13px] font-semibold">L’image est plutôt</p>
          <SegmentedControl aria-label="Ton de l'image" value={v.tone} onChange={(x) => set("tone", x)} options={TONES} fullWidth size="sm" />
        </div>
        <Input label="Sur-titre" value={v.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} maxLength={40} placeholder="Ex. Audio, Nouveau, Exclusivité" hint="Petit texte au-dessus du titre. Facultatif." error={errors.eyebrow} />
        <Textarea label="Titre" required className="min-h-[70px]" value={v.title} onChange={(e) => set("title", e.target.value)} maxLength={120} placeholder={"Galaxy A55\nà prix choc"} hint="Un retour à la ligne = une ligne du titre." error={errors.title} />
        <Input label="Sous-titre" value={v.subtitle} onChange={(e) => set("subtitle", e.target.value)} maxLength={255} placeholder="Ex. Livraison en 24 h à Bukavu et Goma" hint={v.linkKind === "product" ? "Avec un produit, son prix s'affiche à la place du sous-titre sur les petites bannières." : undefined} error={errors.subtitle} />

        <div className="grid gap-2">
          <p className="text-[13px] font-semibold">Le bouton mène vers<span className="ml-0.5 text-danger">*</span></p>
          <SegmentedControl aria-label="Type de destination" value={v.linkKind} onChange={setKind} options={LINK_KINDS} fullWidth size="sm" />
          {v.linkKind === "category" && (
            <Select aria-label="Catégorie" value={v.linkTarget} onChange={(e) => set("linkTarget", e.target.value)} error={errors.linkTarget} options={[{ value: "", label: "Choisir une catégorie…" }, ...(categories ?? []).map((c) => ({ value: c.slug, label: categoryOptionLabel(c) }))]} />
          )}
          {v.linkKind === "product" && (
            <>
              <ProductCombobox
                value={null}
                onChange={(p) => {
                  setV((x) => ({ ...x, productId: p.id, productName: p.name, title: x.title.trim() ? x.title : p.name }));
                  setErrors((e) => ({ ...e, linkTarget: undefined, title: undefined }));
                }}
                error={errors.linkTarget}
              />
              {v.productId ? (
                <p className="text-[12px] text-ink-2">Produit choisi : <b>{v.productName}</b>. Son prix réel s’affiche et le bouton mène à sa fiche.</p>
              ) : null}
            </>
          )}
          {v.linkKind === "page" && (
            <Select aria-label="Page" value={v.linkTarget} onChange={(e) => set("linkTarget", e.target.value)} error={errors.linkTarget} options={[{ value: "", label: "Choisir une page…" }, ...BANNER_PAGES]} />
          )}
          {v.linkKind === "url" && <Input aria-label="Adresse" value={v.linkTarget} onChange={(e) => set("linkTarget", e.target.value)} placeholder="/produits?search=JBL ou https://…" error={errors.linkTarget} />}
          {link && <p className="break-all text-[12px] text-ink-3">Adresse : {link}</p>}
        </div>

        <Input label="Texte du bouton" value={v.linkLabel} onChange={(e) => set("linkLabel", e.target.value)} maxLength={60} placeholder={v.linkKind === "product" ? "Acheter" : "Découvrir"} hint="Vide : texte par défaut." error={errors.linkLabel} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Affichée à partir du" type="datetime-local" value={v.startsAt} onChange={(e) => set("startsAt", e.target.value)} hint="Vide : tout de suite." error={errors.startsAt} />
          <Input label="Jusqu’au" type="datetime-local" value={v.endsAt} onChange={(e) => set("endsAt", e.target.value)} hint="Vide : sans fin." error={errors.endsAt} />
        </div>
        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-box border border-line px-4 active:bg-chip">
          <span className="text-[14px] font-semibold">Bannière active</span>
          <Switch label="Bannière active" checked={v.isActive} onChange={(x) => set("isActive", x)} />
        </label>

        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="chip" upper={false} onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={save.isPending} upper={false}>{banner ? "Enregistrer" : "Créer la bannière"}</Button>
        </div>
      </form>
    </Modal>
  );
}
