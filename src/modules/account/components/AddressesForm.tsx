"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/shared/ui/Button";
import { Checkbox, Input } from "@/shared/ui/Form";
import { toast } from "@/shared/ui/Toast";
import { generalError } from "@/modules/auth/components/fieldErrors";
import { useUpdateAddresses } from "../hooks/useAccount";
import { EMPTY_ADDRESS, type Address, type Profile } from "../types";

function AddressFields({ title, value, onChange, errors }: { title: string; value: Address; onChange: (a: Address) => void; errors?: Record<string, string> }) {
  const set = (k: keyof Address) => (e: { target: { value: string } }) => onChange({ ...value, [k]: e.target.value });
  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 text-[15px] font-bold">{title}</legend>
      <Input label="Adresse" value={value.line1} onChange={set("line1")} error={errors?.line1} placeholder="N°, avenue, rue" autoComplete="street-address" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Quartier / Commune" value={value.line2} onChange={set("line2")} error={errors?.line2} />
        <Input label="Pays" value={value.country} onChange={set("country")} error={errors?.country} />
      </div>
    </fieldset>
  );
}

export function AddressesForm({ profile }: { profile?: Profile }) {
  const mutation = useUpdateAddresses();
  const [delivery, setDelivery] = useState<Address>(EMPTY_ADDRESS);
  const [billing, setBilling] = useState<Address>(EMPTY_ADDRESS);
  const [same, setSame] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!profile) return;
    setDelivery(profile.deliveryAddress);
    setBilling(profile.billingAddress);
    setSame(profile.sameAsDelivery);
  }, [profile]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!delivery.line1.trim()) err.line1 = "L'adresse est requise.";
    if (!delivery.country.trim()) err.country = "Le pays est requis.";
    setErrors(err);
    if (Object.keys(err).length) return;
    mutation.mutate({ deliveryAddress: delivery, billingAddress: same ? delivery : billing, sameAsDelivery: same }, { onSuccess: () => toast.success("Adresses mises à jour") });
  };

  const general = generalError(mutation.error);

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <AddressFields title="Adresse de livraison" value={delivery} onChange={setDelivery} errors={errors} />
      <Checkbox checked={same} onChange={(e) => setSame(e.target.checked)} label="L'adresse de facturation est identique à l'adresse de livraison" />
      <AnimatePresence initial={false}>
        {!same && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <AddressFields title="Adresse de facturation" value={billing} onChange={setBilling} />
          </motion.div>
        )}
      </AnimatePresence>
      {general && <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-[13px] text-danger">{general}</p>}
      <div className="flex justify-end">
        <Button type="submit" loading={mutation.isPending}>Enregistrer</Button>
      </div>
    </form>
  );
}
