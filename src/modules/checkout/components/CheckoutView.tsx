"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown2, ArrowLeft, ArrowRight, Bag2, Send2 } from "iconsax-reactjs";
import { useEffect, useRef, useState } from "react";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Reveal } from "@/shared/animations/Reveal";
import { getErrorMessage } from "@/shared/lib/api";
import { formatPrice } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Textarea } from "@/shared/ui/Form";
import { toast } from "@/shared/ui/Toast";
import { useAddresses, useSaveAddress } from "@/modules/account/hooks/useAddressBook";
import { useProfile } from "@/modules/account/hooks/useAccount";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { generalError } from "@/modules/auth/components/fieldErrors";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { displayName } from "@/modules/auth/types";
import { CartSummary } from "@/modules/cart/components/CartSummary";
import { useCart } from "@/modules/cart/hooks/useCart";
import { unitPrice } from "@/modules/cart/types";
import { useCreateOrder } from "@/modules/orders/hooks/useOrders";
import { PAYMENT_METHODS, type Order } from "@/modules/orders/types";
import { CHECKOUT_STEPS, type CheckoutForm } from "../types";
import { AddressPicker } from "./AddressPicker";
import { CheckoutStepper } from "./CheckoutStepper";
import { OrderSuccess } from "./OrderSuccess";
import { PaymentMethodCards } from "./PaymentMethodCards";

type Errors = Partial<Record<keyof CheckoutForm, string>>;

const EMPTY_FORM: CheckoutForm = {
  addressId: null,
  saveToBook: false,
  addressLabel: "Domicile",
  recipient: "",
  address: "",
  quarter: "",
  city: "Kinshasa",
  country: "RD Congo",
  phone: "",
  paymentMethod: "OrangeMoney",
  note: "",
};

function Content() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: saved, isSuccess: addressesLoaded } = useAddresses();
  const { items, count, total, savings, isEmpty, clear } = useCart();
  const createOrder = useCreateOrder();
  const saveAddress = useSaveAddress();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<{ order: Order; conversationId: number } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [recap, setRecap] = useState(false);
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const initialised = useRef(false);

  // Préremplissage : adresse par défaut du carnet, sinon profil (nouvelle adresse)
  useEffect(() => {
    if (initialised.current || !addressesLoaded) return;
    initialised.current = true;
    const def = saved?.find((a) => a.isDefault) ?? saved?.[0];
    if (def) {
      setForm((f) => ({ ...f, addressId: def.id, recipient: def.recipient, phone: def.phone, address: def.line1, quarter: def.quarter, city: def.city, country: def.country }));
    } else {
      setForm((f) => ({
        ...f,
        recipient: user ? displayName(user) : "",
        phone: profile?.phoneNumber ?? user?.phoneNumber ?? "",
        address: profile?.deliveryAddress.line1 ?? "",
        quarter: profile?.deliveryAddress.line2 ?? "",
        saveToBook: true,
      }));
    }
  }, [addressesLoaded, saved, profile, user]);

  const set = <K extends keyof CheckoutForm>(k: K, v: CheckoutForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const pickAddress = (id: number | null) => {
    const a = id ? saved?.find((x) => x.id === id) : undefined;
    setErrors({});
    setForm((f) =>
      a
        ? { ...f, addressId: a.id, recipient: a.recipient, phone: a.phone, address: a.line1, quarter: a.quarter, city: a.city, country: a.country }
        : { ...f, addressId: null, recipient: user ? displayName(user) : f.recipient, phone: f.phone || (user?.phoneNumber ?? ""), address: "", quarter: "", saveToBook: true },
    );
  };

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
  };

  const validateDelivery = () => {
    if (form.addressId !== null) return true;
    const e: Errors = {};
    if (!form.recipient.trim()) e.recipient = "Indiquez le nom du destinataire.";
    if (!form.address.trim()) e.address = "L'adresse de livraison est requise.";
    if (!form.quarter.trim()) e.quarter = "Indiquez votre quartier ou commune.";
    if (!form.country.trim()) e.country = "Le pays est requis.";
    if (!/^[+\d][\d\s().-]{7,}$/.test(form.phone.trim())) e.phone = "Entrez un numéro valide pour que le revendeur vous joigne.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 0 && !validateDelivery()) return;
    go(step + 1);
  };

  const submit = async () => {
    setSubmitError(null);
    try {
      let addressId = form.addressId;
      // Nouvelle adresse à conserver dans le carnet
      if (addressId === null && form.saveToBook) {
        const a = await saveAddress.mutateAsync({
          input: { label: form.addressLabel, recipient: form.recipient, phone: form.phone, line1: form.address, quarter: form.quarter, city: form.city, country: form.country, isDefault: !saved?.length },
        });
        addressId = a.id;
      }
      const res = await createOrder.mutateAsync({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, variantId: i.variantId ?? null })),
        addressId,
        deliveryAddress: form.address,
        deliveryQuarter: form.quarter,
        deliveryCountry: form.country,
        paymentMethod: form.paymentMethod,
        note: [`Tél : ${form.phone}`, form.note].filter(Boolean).join("\n"),
      });
      clear();
      setDone({ order: res.order, conversationId: res.conversationId });
      toast.success("Commande envoyée", `Commande #${res.order.id}`);
    } catch (e) {
      setSubmitError(generalError(e) ?? getErrorMessage(e));
    }
  };

  if (done) return <OrderSuccess order={done.order} conversationId={done.conversationId} />;

  if (isEmpty) {
    return (
      <Block>
        <EmptyState icon={<Bag2 size={46} variant="Bulk" />} title="Rien à commander" description="Votre panier est vide." action={<Button href={ROUTES.products}>Voir les produits</Button>} />
      </Block>
    );
  }

  const paymentLabel = PAYMENT_METHODS.find((m) => m.value === form.paymentMethod)?.label;
  const pending = createOrder.isPending || saveAddress.isPending;

  return (
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1fr_380px]">
      <Reveal className="min-w-0">
        <Block pad="none" className="p-4 sm:p-[30px]">
          <h1 className="text-[22px] leading-[28px] sm:text-h-page">Finaliser la commande</h1>

          {/* Mobile : récapitulatif repliable (s'ouvre en feuille) */}
          <button onClick={() => setRecap(true)} className="mt-4 flex min-h-14 w-full items-center gap-3 rounded-box bg-primary-50 px-4 py-2.5 text-left active:scale-[0.99] lg:hidden">
            <Bag2 size={20} variant="Bold" className="shrink-0 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold leading-[18px]">Récapitulatif · {count} article{count > 1 ? "s" : ""}</span>
              <span className="block text-[12px] leading-[16px] text-ink-2">Appuyez pour voir le détail</span>
            </span>
            <span className="text-[16px] font-extrabold text-primary">{formatPrice(total)}</span>
            <ArrowDown2 size={16} className="text-ink-3" />
          </button>

          <div className="mb-6 mt-5 sm:mb-8 sm:mt-6"><CheckoutStepper step={step} /></div>

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && <AddressPicker form={form} errors={errors} set={set} onPick={pickAddress} />}

              {step === 1 && (
                <div className="space-y-4 sm:space-y-5">
                  <h2 className="text-[17px] sm:text-[18px]">Comment souhaitez-vous payer ?</h2>
                  <PaymentMethodCards value={form.paymentMethod} onChange={(v) => set("paymentMethod", v)} />
                  <Textarea label="Note pour le revendeur (optionnel)" value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Horaires de livraison, point de repère…" maxLength={500} />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 sm:space-y-5">
                  <h2 className="text-[17px] sm:text-[18px]">Vérifiez votre commande</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-box bg-page/60 p-4 text-[14px] leading-[22px]">
                      <p className="mb-1 text-[12px] font-bold uppercase text-ink-3">Livraison</p>
                      {form.recipient}<br />{form.address}<br />{form.quarter}, {form.city}, {form.country}<br />{form.phone}
                      <button onClick={() => go(0)} className="mt-1 flex min-h-11 items-center text-[13px] font-semibold text-primary hover:underline">Modifier</button>
                    </div>
                    <div className="rounded-box bg-page/60 p-4 text-[14px] leading-[22px]">
                      <p className="mb-1 text-[12px] font-bold uppercase text-ink-3">Paiement</p>
                      {paymentLabel}
                      {form.note && <span className="mt-1 block text-ink-2">« {form.note} »</span>}
                      <button onClick={() => go(1)} className="mt-1 flex min-h-11 items-center text-[13px] font-semibold text-primary hover:underline">Modifier</button>
                    </div>
                  </div>
                  <ul className="divide-y divide-line-3 rounded-box border border-line-3">
                    {items.map((i) => (
                      <li key={`${i.productId}-${i.variantId ?? 0}`} className="flex items-center gap-3 p-3">
                        <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-page">{i.product.image && <Image src={i.product.image} alt="" fill sizes="56px" className="object-cover" />}</span>
                        <p className="min-w-0 flex-1 text-[14px] font-semibold leading-[18px]">
                          <span className="line-clamp-2">{i.product.name}</span>
                          <span className="text-[12px] font-normal text-ink-3">{i.variantLabel ? `${i.variantLabel} · ` : ""}× {i.quantity}</span>
                        </p>
                        <p className="text-[14px] font-bold">{formatPrice(unitPrice(i) * i.quantity)}</p>
                      </li>
                    ))}
                  </ul>
                  {submitError && <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-[13px] text-danger">{submitError}</p>}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* spacer : réserve la place de la barre collante (mobile) */}
          <div aria-hidden className="h-24 lg:hidden" />
          <div className="max-lg:fixed max-lg:inset-x-0 max-lg:bottom-tabbar max-lg:z-40 max-lg:border-t max-lg:border-line-3 max-lg:bg-white/95 max-lg:px-4 max-lg:pb-safe max-lg:pt-3 max-lg:backdrop-blur-xl lg:mt-8">
            <div className="mx-auto flex max-w-[640px] items-center gap-3 lg:mx-0 lg:max-w-none lg:justify-between">
              {step > 0 ? (
                <Button variant="chip" onClick={() => go(step - 1)} leftIcon={<ArrowLeft size={16} />} disabled={pending} className="max-lg:px-4">Retour</Button>
              ) : (
                <Button variant="chip" href={ROUTES.cart} leftIcon={<ArrowLeft size={16} />} className="max-lg:px-4">Panier</Button>
              )}
              {step < CHECKOUT_STEPS.length - 1 ? (
                <Button onClick={next} rightIcon={<ArrowRight size={16} />} className="max-lg:flex-1">Continuer</Button>
              ) : (
                <Button onClick={submit} loading={pending} size="lg" leftIcon={<Send2 size={17} variant="Bold" />} className="max-lg:flex-1">Envoyer la commande</Button>
              )}
            </div>
          </div>
        </Block>
      </Reveal>

      <Reveal delay={0.1} direction="up" className="hidden min-w-0 lg:block">
        <CartSummary title="Votre commande" subtotal={total} savings={savings} count={count} />
      </Reveal>

      <BottomSheet open={recap} onClose={() => setRecap(false)} title="Votre commande">
        <div className="-mx-5 pb-2">
          <CartSummary title="Récapitulatif" subtotal={total} savings={savings} count={count} />
        </div>
      </BottomSheet>
    </div>
  );
}

export function CheckoutView() {
  return (
    <>
      <Breadcrumb items={[{ label: "Panier", href: ROUTES.cart }, { label: "Commande" }]} />
      <AuthGuard>
        <Content />
      </AuthGuard>
    </>
  );
}
