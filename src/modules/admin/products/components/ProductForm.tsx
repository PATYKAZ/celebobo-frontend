"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { Add, CloseCircle } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { Reveal } from "@/shared/animations/Reveal";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Input, Select, Switch, Textarea } from "@/shared/ui/Form";
import { toast } from "@/shared/ui/Toast";
import { useCategories } from "@/modules/categories/hooks/useCategories";
import type { Product } from "@/modules/products/types";
import { useSaveProduct } from "../hooks/useAdminProducts";
import {
  countSentences, EMPTY_FORM, parseCare, productToForm, validateProductForm,
  type FormErrors, type ImageSlotValue, type ProductFormValues,
} from "../types";
import { ImageSlot } from "./ImageSlot";
import { VariantsEditor } from "./VariantsEditor";

function Section({ title, hint, children, delay = 0 }: { title: string; hint?: string; children: ReactNode; delay?: number }) {
  return (
    <Reveal delay={delay}>
      <Block>
        <h2 className="text-[18px] leading-[24px]">{title}</h2>
        {hint && <p className="mt-1 text-[13px] text-ink-3">{hint}</p>}
        <div className="mt-5 grid gap-5">{children}</div>
      </Block>
    </Reveal>
  );
}

const Counter = ({ n, min, max }: { n: number; min?: number; max: number }) => (
  <span className={cn("text-[12px] tabular-nums", n > max || (min != null && n < min) ? "text-danger" : "text-ink-3")}>{n}/{max}</span>
);

const SLOT_LABELS = ["Image principale", "Image 2", "Image 3", "Image 4"];

interface Props {
  product?: Product;
}

export function ProductForm({ product }: Props) {
  const router = useRouter();
  const { data: categories } = useCategories();
  const save = useSaveProduct(product?.id ?? null);

  const [v, setV] = useState<ProductFormValues>(() => (product ? productToForm(product) : EMPTY_FORM));
  const [images, setImages] = useState<ImageSlotValue[]>(() => Array.from({ length: 4 }, (_, i) => ({ url: product?.images[i] ?? null })));
  const [errors, setErrors] = useState<FormErrors>({});
  const [feature, setFeature] = useState("");

  const set = <K extends keyof ProductFormValues>(k: K, val: ProductFormValues[K]) => {
    setV((s) => ({ ...s, [k]: val }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const calc = useMemo(() => {
    const price = Number(v.price) || 0;
    const solde = Number(v.priceSolde) || 0;
    const cost = Number(v.pricePrimary) || 0;
    const onSale = solde > 0 && price > 0 && solde < price;
    const current = onSale ? solde : price;
    return { onSale, percent: onSale ? ((price - solde) / price) * 100 : 0, margin: current - cost, marginPct: current > 0 && cost > 0 ? ((current - cost) / current) * 100 : null, current };
  }, [v.price, v.priceSolde, v.pricePrimary]);

  const addFeature = () => {
    const f = feature.trim();
    if (!f || v.features.includes(f)) return;
    set("features", [...v.features, f]);
    setFeature("");
  };
  const onFeatureKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addFeature();
    }
  };

  const submit = () => {
    const errs = validateProductForm(v, !!images[0].url, !product);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Formulaire incomplet", "Corrigez les champs signalés.");
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    save.mutate(
      { values: v, images },
      {
        onSuccess: () => {
          toast.success(product ? "Produit mis à jour" : "Produit créé", v.name);
          router.push(ROUTES.admin.products);
        },
        onError: (e) => {
          if (e instanceof ApiError && e.status === 400) {
            const map: Record<string, keyof ProductFormValues | "image"> = { categoryFk: "categoryId", longDescription: "longDescription", pricePrimary: "pricePrimary", priceSolde: "priceSolde", dateWish: "dateWish", stockThreshold: "stockThreshold" };
            const next: FormErrors = {};
            for (const [k, msg] of Object.entries(e.fieldErrors)) {
              const key = (map[k] ?? k) as keyof FormErrors;
              next[key] = Array.isArray(msg) ? msg[0] : String(msg);
            }
            setErrors(next);
          }
          toast.error("Enregistrement impossible", getErrorMessage(e));
        },
      },
    );
  };

  const today = new Date().toISOString().slice(0, 10);
  const hasVariants = v.variants.length > 0;
  const variantStock = v.variants.reduce((n, r) => n + (Number(r.stock) || 0), 0);
  const descLen = v.description.trim().length;
  const sentences = countSentences(v.longDescription);
  const care = parseCare(v.charaEntretien);

  return (
    <div className="flex flex-col gap-4">
      <Section title="Informations" hint="Nom et descriptions affichés sur la fiche produit.">
        <Input label="Nom du produit" required value={v.name} onChange={(e) => set("name", e.target.value)} error={errors.name} placeholder="Ex : iPhone 11 Pro 256GB Gris Sidéral" />
        <div>
          <Textarea
            label="Description courte"
            required
            className="min-h-[84px]"
            value={v.description}
            onChange={(e) => set("description", e.target.value)}
            error={errors.description}
            hint="Entre 20 et 100 caractères, sous forme de phrase (contient un verbe : est, avec, permet, offre, dispose, intègre, embarque, équipé)."
          />
          <div className="mt-1 text-right"><Counter n={descLen} min={20} max={100} /></div>
        </div>
        <div>
          <Textarea label="Description longue" className="min-h-[130px]" value={v.longDescription} onChange={(e) => set("longDescription", e.target.value)} error={errors.longDescription} hint="5 phrases maximum." />
          <div className="mt-1 text-right text-[12px] text-ink-3"><span className={sentences > 5 ? "text-danger" : ""}>{sentences}</span>/5 phrases</div>
        </div>
      </Section>

      <Section title="Tarification" hint="Le pourcentage de remise et la marge sont calculés automatiquement." delay={0.03}>
        <div className="grid gap-5 sm:grid-cols-3">
          <Input label="Prix normal ($)" required type="number" min="0" step="0.01" value={v.price} onChange={(e) => set("price", e.target.value)} error={errors.price} />
          <Input label="Prix d'achat ($)" type="number" min="0" step="0.01" value={v.pricePrimary} onChange={(e) => set("pricePrimary", e.target.value)} error={errors.pricePrimary} hint="Jamais visible des clients." />
          <Input label="Prix soldé ($)" type="number" min="0" step="0.01" value={v.priceSolde} onChange={(e) => set("priceSolde", e.target.value)} error={errors.priceSolde} hint="Laissez vide si pas de promo." />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-box bg-page/60 p-4"><p className="text-[12px] text-ink-3">Prix de vente</p><p className="text-[20px] font-bold">{formatPrice(calc.current)}</p></div>
          <div className="rounded-box bg-page/60 p-4"><p className="text-[12px] text-ink-3">Remise</p><p className={cn("text-[20px] font-bold", calc.onSale && "text-danger")}>{calc.onSale ? `-${calc.percent.toFixed(1)}%` : "—"}</p></div>
          <div className="rounded-box bg-page/60 p-4"><p className="text-[12px] text-ink-3">Marge</p><p className={cn("text-[20px] font-bold", calc.margin < 0 ? "text-danger" : "text-primary-dark")}>{v.pricePrimary ? `${formatPrice(calc.margin)}${calc.marginPct != null ? ` · ${calc.marginPct.toFixed(0)}%` : ""}` : "—"}</p></div>
        </div>
      </Section>

      <Section title="Catégorie & badge" delay={0.03}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Select label="Catégorie" required value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)} error={errors.categoryId} options={[{ value: "", label: "Choisir…" }, ...(categories ?? []).map((c) => ({ value: c.id, label: c.name }))]} />
          <Input label="Badge" value={v.badge} onChange={(e) => set("badge", e.target.value)} hint="Ex : Best-seller. « Nouveauté » est ajouté automatiquement pendant 20 jours." />
        </div>
      </Section>

      <Section title="Médias" hint="L'image principale est obligatoire. Les autres alimentent la galerie." delay={0.03}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {images.map((img, i) => (
            <ImageSlot key={i} main={i === 0} label={SLOT_LABELS[i]} value={img} error={i === 0 ? errors.image : undefined} onChange={(nv) => { setImages((s) => s.map((x, j) => (j === i ? nv : x))); if (i === 0) setErrors((e) => ({ ...e, image: undefined })); }} />
          ))}
        </div>
      </Section>

      <Section title="Caractéristiques" hint="Points forts affichés sous forme de puces." delay={0.03}>
        <div className="flex gap-2">
          <input value={feature} onChange={(e) => setFeature(e.target.value)} onKeyDown={onFeatureKey} placeholder="Ex : Écran AMOLED 120 Hz" aria-label="Nouvelle caractéristique" className="field" />
          <Button variant="chip" onClick={addFeature} leftIcon={<Add size={16} />} upper={false} className="shrink-0">Ajouter</Button>
        </div>
        {v.features.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {v.features.map((f) => (
              <li key={f} className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 py-1.5 pl-3.5 pr-2 text-[13px] font-medium text-primary-dark">
                {f}
                <button type="button" aria-label={`Retirer ${f}`} onClick={() => set("features", v.features.filter((x) => x !== f))} className="text-primary-dark/60 hover:text-danger"><CloseCircle size={16} variant="Bold" /></button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Entretien" hint="Séparez les éléments par des sauts de ligne ou des « ; »." delay={0.03}>
        <Textarea aria-label="Entretien" value={v.charaEntretien} onChange={(e) => set("charaEntretien", e.target.value)} placeholder={"Nettoyer avec un chiffon doux\nÉviter l'humidité"} />
        {care.length > 0 && (
          <ul className="grid gap-1.5 rounded-box bg-page/60 p-4 text-[13px]">
            {care.map((c, i) => <li key={`${c}-${i}`} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{c}</li>)}
          </ul>
        )}
      </Section>

      <Section title="Livraison" delay={0.03}>
        <Textarea label="Politique de livraison — phase 1" value={v.deliveryPolicyPhase1} onChange={(e) => set("deliveryPolicyPhase1", e.target.value)} className="min-h-[80px]" />
        <Textarea label="Politique de livraison — phase 2" value={v.deliveryPolicyPhase2} onChange={(e) => set("deliveryPolicyPhase2", e.target.value)} className="min-h-[80px]" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Frais de livraison ($)" type="number" min="0" step="0.01" value={v.shippingFee} onChange={(e) => set("shippingFee", e.target.value)} disabled={v.freeShipping} />
          <div className="flex items-center justify-between gap-3 rounded-box border border-line px-4"><span className="text-[14px] font-semibold">Livraison offerte</span><Switch label="Livraison offerte" checked={v.freeShipping} onChange={(x) => set("freeShipping", x)} /></div>
        </div>
      </Section>

      <Section title="Stock & disponibilité" hint="Le stock en quantité remplace l'ancien interrupteur « en stock » : le produit est en rupture à 0." delay={0.03}>
        <div className="grid gap-5 sm:grid-cols-3">
          <Input
            label="Quantité en stock"
            type="number"
            min="0"
            step="1"
            value={hasVariants ? String(variantStock) : v.stock}
            onChange={(e) => set("stock", e.target.value)}
            disabled={hasVariants}
            error={errors.stock}
            hint={hasVariants ? "Somme des stocks de vos variantes." : product ? "Pour tracer l'historique, préférez « Ajuster le stock » dans la liste." : undefined}
          />
          <Input label="Seuil d'alerte (stock bas)" type="number" min="0" step="1" value={v.stockThreshold} onChange={(e) => set("stockThreshold", e.target.value)} error={errors.stockThreshold} hint="Alerte « stock bas » quand le stock ≤ seuil." />
          <Input label="Devrait être vendu avant le" type="date" value={v.dateWish} min={product ? undefined : today} onChange={(e) => set("dateWish", e.target.value)} error={errors.dateWish} hint="Date objectif de vente (suivi des produits à rotation lente)." />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-box border border-line px-4 py-3">
          <div><p className="text-[14px] font-semibold">Visible en boutique</p><p className="text-[12px] text-ink-3">Désactivez pour masquer le produit sans le supprimer.</p></div>
          <Switch label="Visible en boutique" checked={v.isActive} onChange={(x) => set("isActive", x)} />
        </div>
      </Section>

      <Section title="Variantes" hint="Couleur, stockage, taille… Chaque combinaison a son prix, son stock et son SKU. Laissez vide pour un produit simple." delay={0.03}>
        <VariantsEditor
          options={v.variantOptions}
          rows={v.variants}
          basePrice={Number(v.price) || 0}
          error={errors.variants}
          onChange={({ options, rows }) => {
            setV((s) => ({ ...s, variantOptions: options, variants: rows }));
            setErrors((e) => ({ ...e, variants: undefined, stock: undefined }));
          }}
        />
      </Section>

      <div className="sticky bottom-3 z-30 flex items-center justify-between gap-3 rounded-box bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,.12)] sm:px-5">
        <p className="hidden text-[13px] text-ink-3 sm:block">{product ? `Modification de « ${product.name} »` : "Nouveau produit"}</p>
        <div className="ml-auto flex gap-3">
          <Button variant="chip" upper={false} onClick={() => router.push(ROUTES.admin.products)}>Annuler</Button>
          <Button upper={false} loading={save.isPending} onClick={submit}>{product ? "Enregistrer" : "Créer le produit"}</Button>
        </div>
      </div>
    </div>
  );
}
