"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { InfoCircle, Lock, SearchNormal1, TickCircle } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatPrice } from "@/shared/lib/format";
import { getErrorMessage } from "@/shared/lib/api";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Input, Select } from "@/shared/ui/Form";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PAYMENT_METHODS, type PaymentMethod } from "@/modules/orders/types";
import { StatusDot } from "@/shared/ui/Badges";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { PageHeader } from "../../ui/PageHeader";
import { useConvertibleOrder, useConvertOrder, useOrderSearch } from "../hooks/useSales";
import type { ConvertibleOrder } from "../types";
import { todayStr } from "../utils";

/** Panneau de conversion : une vente par ligne de commande, prix final modifiable. Remonté (key) à chaque commande choisie. */
function ConvertPanel({ co, onDone }: { co: ConvertibleOrder; onDone: () => void }) {
  const o = co.order;
  const convert = useConvertOrder();
  const [prices, setPrices] = useState<Record<number, string>>(() => Object.fromEntries(o.items.map((i) => [i.id, String(i.unitPrice)])));
  const [method, setMethod] = useState<PaymentMethod>(o.paymentMethod ?? "Cash");
  const [soldAt, setSoldAt] = useState(todayStr());
  const [venduA, setVenduA] = useState(o.user.name);
  const [error, setError] = useState("");

  const total = o.items.reduce((n, i) => n + (Number(prices[i.id]) || 0) * i.quantity, 0);
  const diff = total - o.totalPrice;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (o.items.some((i) => prices[i.id] === "" || Number(prices[i.id]) < 0)) return setError("Renseignez un prix final valide pour chaque ligne.");
    setError("");
    convert.mutate(
      { orderId: o.id, input: { lines: o.items.map((i) => ({ itemId: i.id, unitPrice: Number(prices[i.id]) })), method, soldAt, venduA } },
      {
        onSuccess: (res) => {
          toast.success(`${res.sales.length} vente${res.sales.length > 1 ? "s" : ""} enregistrée${res.sales.length > 1 ? "s" : ""}`, `Commande #${o.id} convertie · ${formatPrice(total)}`);
          onDone();
        },
        onError: (er) => {
          setError(getErrorMessage(er));
          toast.error("Conversion impossible", getErrorMessage(er));
        },
      },
    );
  };

  return (
    <motion.form onSubmit={submit} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-[18px]">Commande #{o.id} — {o.user.name}</h3>
          <p className="text-[13px] text-ink-3">Passée le {formatDate(o.createdAt)}{o.assignedRevendeur ? ` · revendeur : ${o.assignedRevendeur.name}` : ""}</p>
        </div>
        <StatusDot tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</StatusDot>
      </div>

      <ul className="divide-y divide-line-3 rounded-box border border-line-3">
        {o.items.map((i) => {
          const price = Number(prices[i.id]) || 0;
          return (
            <li key={i.id} className="flex flex-wrap items-center gap-4 p-3">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-page">{i.productImage && <Image src={i.productImage} alt="" fill sizes="56px" className="object-cover" />}</span>
              <div className="min-w-[160px] flex-1">
                <p className="line-clamp-2 text-[14px] font-bold">{i.productName}</p>
                <p className="text-[12px] text-ink-3">Quantité {i.quantity} · prix commande {formatPrice(i.unitPrice)}</p>
              </div>
              <div className="w-[140px]">
                <Input label="Prix final unitaire ($)" type="number" min={0} step="0.01" value={prices[i.id]} onChange={(e) => setPrices((p) => ({ ...p, [i.id]: e.target.value }))} />
              </div>
              <p className="w-[90px] text-right text-[15px] font-bold">{formatPrice(price * i.quantity)}</p>
            </li>
          );
        })}
      </ul>

      <div className="grid gap-5 sm:grid-cols-3">
        <Input label="Date de la vente" type="date" max={todayStr()} value={soldAt} onChange={(e) => setSoldAt(e.target.value)} />
        <Select label="Moyen de paiement" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))} />
        <Input label="Vendu à" value={venduA} onChange={(e) => setVenduA(e.target.value)} maxLength={50} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-box bg-page/60 p-4">
        <p className="text-[14px] text-ink-2">
          Total des ventes <strong className="ml-1 text-[20px] text-primary">{formatPrice(total)}</strong>
          {diff !== 0 && <span className={cn("ml-2 text-[12px] font-semibold", diff < 0 ? "text-danger" : "text-primary-dark")}>({diff > 0 ? "+" : ""}{formatPrice(diff)} vs commande {formatPrice(o.totalPrice)})</span>}
        </p>
        <Button type="submit" loading={convert.isPending} upper={false} leftIcon={<TickCircle size={18} variant="Bold" />}>Convertir en ventes</Button>
      </div>
      <p className="flex items-start gap-2 text-[12px] text-ink-3"><InfoCircle size={15} className="mt-0.5 shrink-0" /> La commande passera au statut « Livrée » et ne pourra plus être convertie une seconde fois. Le stock est mis à jour.</p>
      {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
    </motion.form>
  );
}

function ResultCard({ co, active, onSelect }: { co: ConvertibleOrder; active: boolean; onSelect: () => void }) {
  const o = co.order;
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!co.convertible}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-3 rounded-box border p-3 text-left transition-all",
        co.convertible ? "hover:border-primary hover:bg-primary-50" : "cursor-not-allowed bg-page/50 opacity-70",
        active ? "border-primary bg-primary-50" : "border-line-3",
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-chip text-[13px] font-bold">#{o.id}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-bold">{o.user.name}</span>
        <span className="block truncate text-[12px] text-ink-3">{o.items.map((i) => i.productName).join(", ")}</span>
        {co.blockedReason && <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-danger"><Lock size={12} variant="Bold" /> {co.blockedReason}</span>}
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[14px] font-bold">{formatPrice(o.totalPrice)}</span>
        <span className="text-[11px] text-ink-3">{formatDate(o.createdAt)}</span>
      </span>
    </button>
  );
}

function ConvertOrderContent() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = Number(params.get("order")) || undefined;
  const [q, setQ] = useState("");
  const dq = useDebounce(q, 250);
  const { data: results, isFetching } = useOrderSearch(dq);
  const { data: preset } = useConvertibleOrder(initial);
  const [picked, setPicked] = useState<ConvertibleOrder | null>(null);

  // ?order=<id> : sélection automatique
  useEffect(() => {
    if (preset && !picked) setPicked(preset);
  }, [preset, picked]);

  const current = picked?.convertible ? picked : null;
  const blockedPreset = picked && !picked.convertible ? picked : null;

  return (
    <>
      <PageHeader title="Convertir une commande en ventes" description="Retrouvez la commande d'un client, ajustez les prix finaux, puis enregistrez les ventes en une fois." />
      <div className="grid gap-4 xl:grid-cols-[400px_1fr]">
        <Block className="space-y-4">
          <div className="relative">
            <SearchNormal1 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, e-mail du client ou n° de commande…" aria-label="Rechercher une commande" className="field pl-10" />
          </div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-3">{q.trim() ? "Résultats" : "Commandes à convertir"}</p>
          <div className="space-y-2">
            {!results ? (
              Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[72px]" />)
            ) : results.length === 0 ? (
              <p className="py-8 text-center text-[14px] text-ink-3">{isFetching ? "Recherche…" : "Aucune commande trouvée."}</p>
            ) : (
              <AnimatePresence initial={false}>
                {results.map((co) => (
                  <motion.div key={co.order.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <ResultCard co={co} active={picked?.order.id === co.order.id} onSelect={() => setPicked(co)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </Block>

        <Block>
          {current ? (
            <ConvertPanel key={current.order.id} co={current} onDone={() => router.push(ROUTES.admin.sales)} />
          ) : (
            <div className="grid min-h-[320px] place-items-center text-center">
              <div className="max-w-[360px]">
                <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary-50 text-primary"><TickCircle size={30} variant="Bulk" /></span>
                <h3 className="mt-4 text-[18px]">{blockedPreset ? `Commande #${blockedPreset.order.id} non convertible` : "Choisissez une commande"}</h3>
                <p className="mt-2 text-[14px] text-ink-2">{blockedPreset ? blockedPreset.blockedReason : "Les lignes de la commande seront préremplies : produit, quantité et prix de la commande."}</p>
              </div>
            </div>
          )}
        </Block>
      </div>
    </>
  );
}

export function ConvertOrderView() {
  return (
    <PermissionGuard permission="sales.convert">
      <ConvertOrderContent />
    </PermissionGuard>
  );
}
