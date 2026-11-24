"use client";

import { AnimatePresence, motion } from "motion/react";
import { Add, Call, Location, Map1, Shop, TickCircle, TruckFast, User } from "@/shared/ui/icons";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { Checkbox, Input, Select } from "@/shared/ui/Form";
import { Skeleton } from "@/shared/ui/Skeleton";
import { addressIcon } from "@/modules/account/components/AddressBookView";
import { useAddresses } from "@/modules/account/hooks/useAddressBook";
import { ADDRESS_LABELS } from "@/modules/account/types";
import type { CartQuote } from "@/modules/cart/types";
import type { CheckoutForm } from "../types";

type Errors = Partial<Record<keyof CheckoutForm, string>>;

interface Props {
  form: CheckoutForm;
  errors: Errors;
  set: <K extends keyof CheckoutForm>(k: K, v: CheckoutForm[K]) => void;
  /** Sélectionne une adresse enregistrée (préremplit le formulaire) ou « nouvelle » (id null) */
  onPick: (id: number | null) => void;
  /** Villes des zones de livraison (suggestions) */
  cities?: string[];
  /** Devis de la ville choisie : zone, frais et délai */
  zone?: CartQuote;
}

/** Étape livraison : cartes radio du carnet d'adresses + « Nouvelle adresse » (avec option d'enregistrement). */
export function AddressPicker({ form, errors, set, onPick, cities = [], zone }: Props) {
  const { data: saved, isLoading } = useAddresses();
  const isNew = form.addressId === null;
  const methods = [
    { pickup: false, icon: TruckFast, title: "Livraison", hint: "À l'adresse de votre choix" },
    { pickup: true, icon: Shop, title: "Retrait sur place", hint: "Gratuit, dès la confirmation" },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {(zone?.pickupAvailable || form.pickup) && (
        <div role="radiogroup" aria-label="Mode de livraison" className="grid grid-cols-2 gap-3">
          {methods.map((m) => {
            const active = form.pickup === m.pickup;
            return (
              <button
                key={m.title}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set("pickup", m.pickup)}
                className={cn("flex items-center gap-3 rounded-box border-2 p-3 text-left transition sm:p-4", active ? "border-primary bg-primary-50" : "border-line-3 hover:border-primary/50")}
              >
                <m.icon size={22} variant="Bold" className={cn("shrink-0", active ? "text-primary" : "text-ink-3")} />
                <span className="min-w-0">
                  <span className="block text-sm font-bold sm:text-sm">{m.title}</span>
                  <span className="block text-xs text-ink-2">{m.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {form.pickup && zone?.pickupAddress && (
        <p className="flex items-start gap-2 rounded-md bg-primary-50 px-3 py-2.5 text-sm">
          <Shop size={18} variant="Bold" className="mt-px shrink-0 text-primary" />
          <span>
            À retirer : <strong>{zone.pickupAddress}</strong>
            {zone.deliveryEstimate && <> · {zone.deliveryEstimate}</>}. Vos coordonnées ci-dessous permettent au revendeur de vous prévenir.
          </span>
        </p>
      )}

      <h2 className="text-base sm:text-lg">{form.pickup ? "Vos coordonnées" : "Où devons-nous livrer ?"}</h2>

      <div role="radiogroup" aria-label="Adresse de livraison" className="grid gap-3 sm:grid-cols-2">
        {isLoading && (
          <>
            <Skeleton className="h-[120px] rounded-box!" />
            <Skeleton className="h-[120px] rounded-box!" />
          </>
        )}
        {saved?.map((a) => {
          const Icon = addressIcon(a.label);
          const active = form.addressId === a.id;
          return (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onPick(a.id)}
              className={cn("relative rounded-box border-2 p-4 text-left transition", active ? "border-primary bg-primary-50" : "border-line-3 hover:border-primary/50")}
            >
              {active && <TickCircle size={20} variant="Bold" className="absolute right-3 top-3 text-primary" />}
              <span className="flex items-center gap-2 text-sm font-bold">
                <Icon size={18} variant="Bold" className={active ? "text-primary" : "text-ink-3"} /> {a.label}
                {a.isDefault && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">Défaut</span>}
              </span>
              <span className="mt-2 block text-sm text-ink-2">
                {a.recipient} · {a.phone}
                <br />
                {a.line1}, {a.quarter}, {a.city}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          role="radio"
          aria-checked={isNew}
          onClick={() => onPick(null)}
          className={cn("flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-box border-2 border-dashed p-4 sm:min-h-[120px] text-sm font-bold transition", isNew ? "border-primary bg-primary-50 text-primary-dark" : "border-line hover:border-primary/60 hover:text-primary")}
        >
          <span className="grid size-10 place-items-center rounded-full bg-surface"><Add size={20} /></span>
          Nouvelle adresse
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isNew && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="space-y-4 pt-1 sm:space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                <Input label="Destinataire" required value={form.recipient} onChange={(e) => set("recipient", e.target.value)} error={errors.recipient} leftIcon={<User size={17} />} autoComplete="name" />
                <Input label="Téléphone" required value={form.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} leftIcon={<Call size={17} />} placeholder="+243 …" autoComplete="tel" inputMode="tel" enterKeyHint="next" />
              </div>
              <Input label="Adresse" required value={form.address} onChange={(e) => set("address", e.target.value)} error={errors.address} leftIcon={<Location size={17} />} placeholder="N°, avenue, rue" autoComplete="street-address" />
              <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
                <Input label="Quartier / Commune" required value={form.quarter} onChange={(e) => set("quarter", e.target.value)} error={errors.quarter} leftIcon={<Map1 size={17} />} />
                <Input label="Ville" required value={form.city} onChange={(e) => set("city", e.target.value)} error={errors.city} list="checkout-cities" autoComplete="address-level2" placeholder="Ex. Bukavu, Goma" />
                <datalist id="checkout-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
                <Input label="Pays" required value={form.country} onChange={(e) => set("country", e.target.value)} error={errors.country} />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Checkbox label="Enregistrer cette adresse dans mon carnet" checked={form.saveToBook} onChange={(e) => set("saveToBook", e.target.checked)} />
                {form.saveToBook && <Select aria-label="Libellé" value={form.addressLabel} onChange={(e) => set("addressLabel", e.target.value)} options={ADDRESS_LABELS.map((l) => ({ value: l, label: l }))} wrapperClassName="w-full sm:w-[160px]" className="sm:h-9!" />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!form.pickup && zone?.shippingZone && !zone.shippingQuoteRequired && (
        <p className="flex items-center gap-2 rounded-md bg-page/60 px-3 py-2.5 text-sm">
          <TruckFast size={18} variant="Bold" className="shrink-0 text-primary" />
          <span>
            Zone <strong>{zone.shippingZone}</strong>
            {zone.deliveryEstimate && <> · {zone.deliveryEstimate}</>} · {zone.shippingFee > 0 ? formatPrice(zone.shippingFee) : "livraison offerte"}
          </span>
        </p>
      )}
      {!form.pickup && zone?.shippingQuoteRequired && (
        <p className="flex items-start gap-2 rounded-md bg-star/10 px-3 py-2.5 text-sm text-warn">
          <TruckFast size={18} variant="Bold" className="mt-px shrink-0" />
          <span>
            Votre ville est livrée <strong>sur devis</strong>
            {zone.deliveryEstimate && <> ({zone.deliveryEstimate})</>}. Votre commande est enregistrée sans frais de livraison ; un revendeur vous indique le coût et le délai dans la discussion. Vous acceptez, ou vous annulez sans frais.
          </span>
        </p>
      )}
    </div>
  );
}
