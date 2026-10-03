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
  BADGE_OPTIONS, countSentences, DESCRIPTION_MAX, DESCRIPTION_MIN, EMPTY_FORM, parseCare, productToForm, validateProductForm,
  type FormErrors, type ImageSlotValue, type ProductBadgeCode, type ProductFormValues,
} from "../types";
import { ImageSlot } from "./ImageSlot";
import { VariantsEditor } from "./VariantsEditor";

function Section({ title, hint, children, delay = 0 }: { title: string; hint?: string; children: ReactNode; delay?: number }) {
  return (
    <Reveal delay={delay}>
      <Block pad="none" className="p-4 sm:p-[30px]">
        <h2 className="text-[16px] leading-[22px] sm:text-[18px] sm:leading-[24px]">{title}</h2>
        {hint && <p className="mt-1 text-[12px] leading-[17px] text-ink-3 sm:text-[13px]">{hint}</p>}
        <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5">{children}</div>
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
            hint={`Entre ${DESCRIPTION_MIN} et ${DESCRIPTION_MAX} caractères, sous forme de phrase.`}
          />
          <div className="mt-1 text-right"><Counter n={descLen} min={DESCRIPTION_MIN} max={DESCRIPTION_MAX} /></div>
        </div>
        <div>
          <Textarea label="Description longue" className="min-h-[130px]" value={v.longDescription} onChange={(e) => set("longDescription", e.target.value)} error={errors.longDescription} hint="5 phrases maximum." />
          <div className="mt-1 text-right text-[12px] text-ink-3"><span className={sentences > 5 ? "text-danger" : ""}>{sentences}</span>/5 phrases</div>
        </div>
      </Section>

      <Section title="Tarification" hint="Le pourcentage de remise et la marge sont calculés automatiquement." delay={0.03}>
        <div className="grid gap-5 sm:grid-cols-3">
          <Input label="Prix normal ($)" required type="number" inputMode="decimal" min="0" step="0.01" value={v.price} onChange={(e) => set("price", e.target.value)} error={errors.price} />
          <Input label="Prix d'achat ($)" type="number" inputMode="decimal" min="0" step="0.01" value={v.pricePrimary} onChange={(e) => set("pricePrimary", e.target.value)} error={errors.pricePrimary} hint="Jamais visible des clients." />
          <Input label="Prix soldé ($)" type="number" inputMode="decimal" min="0" step="0.01" value={v.priceSolde} onChange={(e) => set("priceSolde", e.target.value)} error={errors.priceSolde} hint="Laissez vide si pas de promo." />
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
          <div className="rounded-box bg-page/60 p-3.5 sm:p-4"><p className="text-[12px] text-ink-3">Prix de vente</p><p className="text-[18px] font-bold sm:text-[20px]">{formatPrice(calc.current)}</p></div>
          <div className="rounded-box bg-page/60 p-3.5 sm:p-4"><p className="text-[12px] text-ink-3">Remise</p><p className={cn("text-[18px] font-bold sm:text-[20px]", calc.onSale && "text-danger")}>{calc.onSale ? `-${calc.percent.toFixed(1)}%` : "—"}</p></div>
          <div className="col-span-2 rounded-box bg-page/60 p-3.5 sm:col-span-1 sm:p-4"><p className="text-[12px] text-ink-3">Marge</p><p className={cn("text-[18px] font-bold sm:text-[20px]", calc.margin < 0 ? "text-danger" : "text-primary-dark")}>{v.pricePrimary ? `${formatPrice(calc.margin)}${calc.marginPct != null ? ` · ${calc.marginPct.toFixed(0)}%` : ""}` : "—"}</p></div>
        </div>
      </Section>

      <Section title="Catégorie & badge" delay={0.03}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Select label="Catégorie" required value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)} error={errors.categoryId} options={[{ value: "", label: "Choisir…" }, ...(categories ?? []).map((c) => ({ value: c.id, label: c.name }))]} />
          <Select label="Badge" value={v.badge} onChange={(e) => set("badge", e.target.value as ProductBadgeCode | "")} options={BADGE_OPTIONS} />
        </div>
      </Section>

      <Section title="Médias" hint="L'image principale est obligatoire. Les autres alimentent la galerie." delay={0.03}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
              <li key={f} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-primary-50 py-0.5 pl-3.5 pr-1 text-[13px] font-medium text-primary-dark">
                {f}
                <button type="button" aria-label={`Retirer ${f}`} onClick={() => set("features", v.features.filter((x) => x !== f))} className="grid size-8 place-items-center rounded-full text-primary-dark/60 hover:text-danger active:scale-90"><CloseCircle size={17} variant="Bold" /></button>
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
          <Input label="Frais de livraison ($)" type="number" inputMode="decimal" min="0" step="0.01" value={v.shippingFee} onChange={(e) => set("shippingFee", e.target.value)} disabled={v.freeShipping} />
          <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-box border border-line px-4 active:bg-chip"><span className="text-[14px] font-semibold">Livraison offerte</span><Switch label="Livraison offerte" checked={v.freeShipping} onChange={(x) => set("freeShipping", x)} /></label>
        </div>
      </Section>

      <Section title="Stock & disponibilité" hint="Le stock en quantité remplace l'ancien interrupteur « en stock » : le produit est en rupture à 0." delay={0.03}>
        <div className="grid gap-5 sm:grid-cols-3">
          <Input
            label="Quantité en stock"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={hasVariants ? String(variantStock) : v.stock}
            onChange={(e) => set("stock", e.target.value)}
            disabled={hasVariants}
            error={errors.stock}
            hint={hasVariants ? "Somme des stocks de vos variantes." : product ? "Pour tracer l'historique, préférez « Ajuster le stock » dans la liste." : undefined}
          />
          <Input label="Seuil d'alerte (stock bas)" type="number" inputMode="numeric" min="0" step="1" value={v.stockThreshold} onChange={(e) => set("stockThreshold", e.target.value)} error={errors.stockThreshold} hint="Alerte « stock bas » quand le stock ≤ seuil." />
          <Input label="Devrait être vendu avant le" type="date" value={v.dateWish} min={product ? undefined : today} onChange={(e) => set("dateWish", e.target.value)} error={errors.dateWish} hint="Date objectif de vente (suivi des produits à rotation lente)." />
        </div>
        <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-box border border-line px-4 py-3 active:bg-chip">
          <div><p className="text-[14px] font-semibold">Visible en boutique</p><p className="text-[12px] text-ink-3">Désactivez pour masquer le produit sans le supprimer.</p></div>
          <Switch label="Visible en boutique" checked={v.isActive} onChange={(x) => set("isActive", x)} />
        </label>
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

      {/* réserve la place de la barre fixe (mobile) */}
      <div className="h-20 lg:hidden" aria-hidden />
      {/* Mobile : fixée au-dessus de la barre d'onglets (zone sûre iOS) ; desktop : carte collante en bas */}
      <div className="fixed inset-x-0 bottom-[max(var(--tabbar-h),env(safe-area-inset-bottom))] z-40 flex items-center justify-between gap-3 border-t border-line-3 bg-white/95 px-4 py-3 backdrop-blur-xl lg:sticky lg:inset-x-auto lg:bottom-3 lg:z-30 lg:rounded-box lg:border-0 lg:bg-white lg:p-3 lg:shadow-[0_8px_30px_rgba(0,0,0,.12)] lg:backdrop-blur-none">
        <p className="hidden pl-2 text-[13px] text-ink-3 lg:block">{product ? `Modification de « ${product.name} »` : "Nouveau produit"}</p>
        <div className="grid w-full grid-cols-[1fr_1.6fr] gap-3 lg:ml-auto lg:flex lg:w-auto">
          <Button variant="chip" upper={false} onClick={() => router.push(ROUTES.admin.products)}>Annuler</Button>
          <Button upper={false} loading={save.isPending} onClick={submit}>{product ? "Enregistrer" : "Créer le produit"}</Button>
        </div>
      </div>
    </div>
  );
}
