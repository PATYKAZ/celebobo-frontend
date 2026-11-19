"use client";

import { useState, type FormEvent } from "react";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { Button } from "@/shared/ui/Button";
import { Input, Switch, Textarea } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { toast } from "@/shared/ui/Toast";
import { Markdown } from "@/modules/pages/components/Markdown";
import { useSavePage } from "../hooks/useAdminPages";
import { EMPTY_PAGE, pageToForm, type AdminPage, type PageFormValues } from "../services/admin-pages.service";

type Errors = Partial<Record<keyof PageFormValues, string>>;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validate(v: PageFormValues): Errors {
  const e: Errors = {};
  if (!v.title.trim()) e.title = "Le titre est requis.";
  if (!SLUG.test(v.slug.trim())) e.slug = "Lettres minuscules, chiffres et tirets (ex. politique-de-livraison).";
  if (!v.body.trim()) e.body = "Le texte est requis.";
  return e;
}

const slugify = (title: string) =>
  title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/** Création / modification d'une page ou d'une politique, avec aperçu du rendu. */
export function PageFormModal({ page, onClose }: { page: AdminPage | null; onClose: () => void }) {
  const [v, setV] = useState<PageFormValues>(() => (page ? pageToForm(page) : EMPTY_PAGE));
  const [errors, setErrors] = useState<Errors>({});
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const save = useSavePage(page);
  const set = <K extends keyof PageFormValues>(k: K, value: PageFormValues[K]) => {
    setV((x) => ({ ...x, [k]: value }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(v);
    setErrors(found);
    if (Object.keys(found).length) {
      setTab("edit");
      return;
    }
    save.mutate(v, {
      onSuccess: (p) => {
        toast.success(page ? "Page mise à jour" : "Page créée", p.title);
        onClose();
      },
      onError: (err) => {
        if (err instanceof ApiError && (err.status === 400 || err.status === 409)) {
          const next: Errors = {};
          for (const [k, msg] of Object.entries(err.fieldErrors)) next[k as keyof PageFormValues] = Array.isArray(msg) ? String(msg[0]) : String(msg);
          if (err.code === "slug_taken") next.slug = getErrorMessage(err);
          setErrors(next);
        }
        toast.error("Enregistrement impossible", getErrorMessage(err));
      },
    });
  };

  return (
    <Modal open onClose={onClose} title={page ? `Modifier « ${page.title} »` : "Nouvelle page"} className="max-w-[860px]">
      <form onSubmit={submit} noValidate className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Titre"
            required
            value={v.title}
            onChange={(e) => {
              set("title", e.target.value);
              if (!page && (!v.slug || v.slug === slugify(v.title))) set("slug", slugify(e.target.value));
            }}
            error={errors.title}
            maxLength={160}
          />
          <Input label="Adresse de la page" required value={v.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} hint={`/pages/${v.slug || "…"}`} error={errors.slug} maxLength={80} />
        </div>
        <Input label="Résumé" value={v.summary} onChange={(e) => set("summary", e.target.value)} hint="Affiché sous le titre et dans la liste « Informations utiles »." maxLength={300} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Version" value={v.version} onChange={(e) => set("version", e.target.value)} placeholder="Ex. 0.9.2" hint="Pour une politique." maxLength={20} />
          <Input label="En vigueur le" type="date" value={v.effectiveOn} onChange={(e) => set("effectiveOn", e.target.value)} hint="Pour une politique." />
          <Input label="Ordre" type="number" inputMode="numeric" min="0" value={v.position} onChange={(e) => set("position", e.target.value)} />
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[14px] font-semibold">Texte</p>
            <SegmentedControl<"edit" | "preview">
              aria-label="Texte ou aperçu"
              value={tab}
              onChange={setTab}
              options={[
                { value: "edit", label: "Modifier" },
                { value: "preview", label: "Aperçu" },
              ]}
              size="sm"
            />
          </div>
          {tab === "edit" ? (
            <Textarea
              aria-label="Texte de la page"
              value={v.body}
              onChange={(e) => set("body", e.target.value)}
              error={errors.body}
              className="min-h-[360px] font-mono text-[13px] leading-[20px]"
              hint="Mise en forme : ## Titre, ### Sous-titre, - liste, 1. liste numérotée, **gras**, *italique*, [lien](/pages/…), tableaux | Colonne | Colonne |."
            />
          ) : (
            <div className="max-h-[480px] overflow-y-auto rounded-box border border-line-3 p-4 sm:p-6">
              {v.body.trim() ? <Markdown source={v.body} /> : <p className="text-[13px] text-ink-3">Rien à afficher pour l&apos;instant.</p>}
            </div>
          )}
        </div>

        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-box border border-line px-4 active:bg-chip">
          <span className="text-[14px] font-semibold">Publiée sur le site</span>
          <Switch label="Publiée sur le site" checked={v.isPublished} onChange={(x) => set("isPublished", x)} />
        </label>

        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="chip" upper={false} onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={save.isPending} upper={false}>{page ? "Enregistrer" : "Créer la page"}</Button>
        </div>
      </form>
    </Modal>
  );
}
