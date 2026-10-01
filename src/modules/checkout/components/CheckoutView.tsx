"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Bag2, Call, Location, Map1, Send2 } from "iconsax-reactjs";
import { useEffect, useRef, useState } from "react";
import { ROUTES } from "@/config/routes";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Reveal } from "@/shared/animations/Reveal";
import { formatPrice } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Input, Textarea } from "@/shared/ui/Form";
import { toast } from "@/shared/ui/Toast";
import { useProfile } from "@/modules/account/hooks/useAccount";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { generalError } from "@/modules/auth/components/fieldErrors";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { CartSummary } from "@/modules/cart/components/CartSummary";
import { useCart } from "@/modules/cart/hooks/useCart";
import { unitPrice } from "@/modules/cart/types";
import { useCreateOrder } from "@/modules/orders/hooks/useOrders";
import { PAYMENT_METHODS } from "@/modules/orders/types";
import { CHECKOUT_STEPS, type CheckoutForm } from "../types";
import { CheckoutStepper } from "./CheckoutStepper";
import { OrderSuccess } from "./OrderSuccess";
import { PaymentMethodCards } from "./PaymentMethodCards";

type Errors = Partial<Record<keyof CheckoutForm, string>>;

function Content() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { items, count, total, savings, isEmpty, clear } = useCart();
  const createOrder = useCreateOrder();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<{ orderId: number; conversationId: number } | null>(null);
  const [form, setForm] = useState<CheckoutForm>({ address: "", quarter: "", country: "RD Congo", phone: "", paymentMethod: "OrangeMoney", note: "" });
  const prefilled = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (prefilled.current || !profile) return;
    prefilled.current = true;
    setForm((f) => ({
      ...f,
      address: profile.deliveryAddress.line1,
      quarter: profile.deliveryAddress.line2,
      country: profile.deliveryAddress.country || f.country,
      phone: profile.phoneNumber ?? user?.phoneNumber ?? "",
    }));
  }, [profile, user]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const set = <K extends keyof CheckoutForm>(k: K, v: CheckoutForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
  };

  const validateDelivery = () => {
    const e: Errors = {};
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

  const submit = () => {
    createOrder.mutate(
      {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddress: form.address,
        deliveryQuarter: form.quarter,
        deliveryCountry: form.country,
        paymentMethod: form.paymentMethod,
        note: [`Tél : ${form.phone}`, form.note].filter(Boolean).join("\n"),
      },
      {
        onSuccess: (res) => {
          clear();
          setDone({ orderId: res.order.id, conversationId: res.conversationId });
          toast.success("Commande envoyée", `Commande #${res.order.id}`);
          timer.current = setTimeout(() => router.push(ROUTES.conversation(res.conversationId)), 3500);
        },
      },
    );
  };

  if (done) return <OrderSuccess orderId={done.orderId} conversationId={done.conversationId} />;

  if (isEmpty) {
    return (
      <Block>
        <EmptyState icon={<Bag2 size={46} variant="Bulk" />} title="Rien à commander" description="Votre panier est vide." action={<Button href={ROUTES.products}>Voir les produits</Button>} />
      </Block>
    );
  }

  const paymentLabel = PAYMENT_METHODS.find((m) => m.value === form.paymentMethod)?.label;
  const err = generalError(createOrder.error);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <Reveal>
        <Block>
          <h1 className="text-h-page">Finaliser la commande</h1>
          <div className="mb-8 mt-6"><CheckoutStepper step={step} /></div>

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && (
                <div className="space-y-5">
                  <h2 className="text-[18px]">Où devons-nous livrer ?</h2>
                  <Input label="Adresse" required value={form.address} onChange={(e) => set("address", e.target.value)} error={errors.address} leftIcon={<Location size={17} />} placeholder="N°, avenue, rue" autoComplete="street-address" />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input label="Quartier / Commune" required value={form.quarter} onChange={(e) => set("quarter", e.target.value)} error={errors.quarter} leftIcon={<Map1 size={17} />} />
                    <Input label="Pays" required value={form.country} onChange={(e) => set("country", e.target.value)} error={errors.country} />
                  </div>
                  <Input label="Téléphone" required value={form.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} leftIcon={<Call size={17} />} placeholder="+243 …" autoComplete="tel" />
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-[18px]">Comment souhaitez-vous payer ?</h2>
                  <PaymentMethodCards value={form.paymentMethod} onChange={(v) => set("paymentMethod", v)} />
                  <Textarea label="Note pour le revendeur (optionnel)" value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Horaires de livraison, point de repère…" maxLength={500} />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-[18px]">Vérifiez votre commande</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-box bg-page/60 p-4 text-[14px] leading-[22px]">
                      <p className="mb-1 text-[12px] font-bold uppercase text-ink-3">Livraison</p>
                      {form.address}<br />{form.quarter}, {form.country}<br />{form.phone}
                      <button onClick={() => go(0)} className="mt-2 block text-[13px] font-semibold text-primary hover:underline">Modifier</button>
                    </div>
                    <div className="rounded-box bg-page/60 p-4 text-[14px] leading-[22px]">
                      <p className="mb-1 text-[12px] font-bold uppercase text-ink-3">Paiement</p>
                      {paymentLabel}
                      {form.note && <span className="mt-1 block text-ink-2">« {form.note} »</span>}
                      <button onClick={() => go(1)} className="mt-2 block text-[13px] font-semibold text-primary hover:underline">Modifier</button>
                    </div>
                  </div>
                  <ul className="divide-y divide-line-3 rounded-box border border-line-3">
                    {items.map((i) => (
                      <li key={i.productId} className="flex items-center gap-3 p-3">
                        <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-page">{i.product.image && <Image src={i.product.image} alt="" fill sizes="56px" className="object-cover" />}</span>
                        <p className="min-w-0 flex-1 truncate text-[14px] font-semibold">{i.product.name} <span className="text-ink-3">× {i.quantity}</span></p>
                        <p className="text-[14px] font-bold">{formatPrice(unitPrice(i) * i.quantity)}</p>
                      </li>
                    ))}
                  </ul>
                  {err && <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-[13px] text-danger">{err}</p>}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 0 ? (
              <Button variant="chip" onClick={() => go(step - 1)} leftIcon={<ArrowLeft size={16} />} disabled={createOrder.isPending}>Retour</Button>
            ) : (
              <Button variant="chip" href={ROUTES.cart} leftIcon={<ArrowLeft size={16} />}>Panier</Button>
            )}
            {step < CHECKOUT_STEPS.length - 1 ? (
              <Button onClick={next} rightIcon={<ArrowRight size={16} />}>Continuer</Button>
            ) : (
              <Button onClick={submit} loading={createOrder.isPending} size="lg" leftIcon={<Send2 size={17} variant="Bold" />}>Envoyer la commande</Button>
            )}
          </div>
        </Block>
      </Reveal>

      <Reveal delay={0.1} direction="left">
        <CartSummary title="Votre commande" subtotal={total} savings={savings} count={count} />
      </Reveal>
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
