"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight2, Box1, Call, SearchNormal1 } from "iconsax-reactjs";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ROUTES } from "@/config/routes";
import { Reveal } from "@/shared/animations/Reveal";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { ApiError, getErrorMessage } from "@/shared/lib/api";
import { formatDateTime, formatPrice } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Form";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useOrders } from "@/modules/orders/hooks/useOrders";
import { OrderStatusBadge } from "@/modules/orders/components/OrderStatusBadge";
import { OrderTimeline } from "@/modules/orders/components/OrderTimeline";
import { useTrackOrder } from "../hooks/useTracking";

/** Raccourci « mes commandes récentes » (monté uniquement si connecté : pas d'appel API anonyme). */
function MyRecentOrders() {
  const { data: mine } = useOrders({ status: "all", page: 1, pageSize: 5 });
  if (!mine || mine.results.length === 0) return null;
  return (
    <div className="mt-8 border-t border-line-3 pt-5">
      <p className="text-[12px] font-bold uppercase tracking-wide text-ink-3">Mes commandes récentes</p>
      <ul className="mt-3 space-y-2">
        {mine.results.map((o) => (
          <li key={o.id}>
            <a href={ROUTES.orderDetail(o.id)} className="group flex items-center gap-3 rounded-md bg-page/60 px-3 py-2.5 text-[13px] transition-colors hover:bg-primary-50">
              <strong>#{o.id}</strong>
              <span className="flex-1 text-ink-3">{formatPrice(o.totalPrice)}</span>
              <OrderStatusBadge status={o.status} />
              <ArrowRight2 size={14} className="transition-transform group-hover:translate-x-1" />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[12px] text-ink-3">Connecté : le suivi détaillé est disponible depuis votre compte.</p>
    </div>
  );
}

/** Suivi de commande public : numéro + e-mail/téléphone. Les utilisateurs connectés ont un raccourci vers leurs commandes. */
export function TrackingView() {
  const params = useSearchParams();
  const { isAuthenticated } = useAuth();
  const track = useTrackOrder();
  const [number, setNumber] = useState(params.get("number") ?? "");
  const [contact, setContact] = useState("");
  const [errors, setErrors] = useState<{ number?: string; contact?: string }>({});

  const run = (n: string, c: string) => {
    setErrors({});
    track.mutate(
      { number: n, contact: c },
      {
        onError: (e) => {
          if (e instanceof ApiError && e.status === 400) {
            const fe = e.fieldErrors;
            setErrors({ number: ([] as string[]).concat(fe.number ?? [])[0], contact: ([] as string[]).concat(fe.contact ?? [])[0] });
          }
        },
      },
    );
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(number, contact);
  };

  const result = track.data;
  const notFound = track.error instanceof ApiError && track.error.status === 404;

  return (
    <>
      <Breadcrumb items={[{ label: "Suivre ma commande" }]} />

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <Reveal direction="right">
          <Block className="h-full">
            <span className="grid size-14 place-items-center rounded-full bg-primary-100 text-primary-dark"><Box1 size={28} variant="Bold" /></span>
            <h1 className="mt-4 text-h-page">Suivre ma commande</h1>
            <p className="mb-6 mt-1 text-[14px] leading-[21px] text-ink-2">Pas besoin de compte : entrez votre numéro de commande et l&apos;e-mail ou le téléphone utilisé.</p>

            <form onSubmit={submit} noValidate className="space-y-4">
              <Input label="Numéro de commande" required value={number} onChange={(e) => { setNumber(e.target.value); setErrors((x) => ({ ...x, number: undefined })); }} error={errors.number} leftIcon={<span className="text-[15px] font-bold">#</span>} placeholder="42" inputMode="numeric" />
              <Input label="E-mail ou téléphone" required value={contact} onChange={(e) => { setContact(e.target.value); setErrors((x) => ({ ...x, contact: undefined })); }} error={errors.contact} leftIcon={<Call size={17} />} placeholder="vous@exemple.com ou +243…" />
              <Button type="submit" fullWidth size="lg" loading={track.isPending} leftIcon={<SearchNormal1 size={17} variant="Bold" />}>Suivre</Button>
            </form>

            {isAuthenticated && <MyRecentOrders />}
          </Block>
        </Reveal>

        <Reveal direction="left">
          <Block className="h-full min-h-[340px]">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div key={result.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[12px] uppercase text-ink-3">Commande</p>
                      <h2 className="text-[24px] leading-[30px]">#{result.id}</h2>
                      <p className="text-[13px] text-ink-2">Passée le {formatDateTime(result.createdAt)} · {formatPrice(result.totalPrice)}</p>
                    </div>
                    <OrderStatusBadge status={result.status} />
                  </div>
                  <div className="mt-8 hidden md:block"><OrderTimeline order={result} /></div>
                  <div className="mt-8 grid gap-8 md:grid-cols-2">
                    <div>
                      <p className="mb-3 text-[12px] font-bold uppercase text-ink-3">Historique</p>
                      <OrderTimeline order={result} layout="vertical" />
                    </div>
                    <div>
                      <p className="mb-3 text-[12px] font-bold uppercase text-ink-3">Articles</p>
                      <ul className="space-y-2">
                        {result.items.map((i, k) => (
                          <li key={k} className="rounded-md bg-page/60 px-3 py-2.5 text-[13px] leading-[18px]">
                            <strong>{i.name}</strong>
                            <span className="block text-ink-3">{i.variantLabel ? `${i.variantLabel} · ` : ""}× {i.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid h-full min-h-[300px] place-items-center text-center">
                  <div>
                    <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="mx-auto grid size-20 place-items-center rounded-full bg-chip text-ink-3"><Box1 size={36} variant="Bulk" /></motion.span>
                    <h2 className="mt-5 text-[20px]">{notFound ? "Aucune commande trouvée" : "Le suivi s'affichera ici"}</h2>
                    <p className="mx-auto mt-2 max-w-[360px] text-[14px] leading-[21px] text-ink-2">
                      {notFound ? "Vérifiez le numéro et l'e-mail ou le téléphone saisi. Besoin d'aide ? Contactez-nous." : track.isError ? getErrorMessage(track.error) : "Renseignez le formulaire pour voir l'avancement de votre commande en un coup d'œil."}
                    </p>
                    {notFound && <Button href={ROUTES.contact} variant="chip" className="mt-5" upper={false}>Contacter le support</Button>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Block>
        </Reveal>
      </div>
    </>
  );
}
