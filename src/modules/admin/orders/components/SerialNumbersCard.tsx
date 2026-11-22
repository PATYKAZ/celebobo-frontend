"use client";

import { useState } from "react";
import { Tag } from "@/shared/ui/icons";
import { Reveal } from "@/shared/animations/Reveal";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Form";
import { toast } from "@/shared/ui/Toast";
import { getErrorMessage } from "@/shared/lib/api";
import { useCan } from "@/modules/auth/hooks/useCan";
import type { Order, OrderItem } from "@/modules/orders/types";
import { useRecordSerials } from "../hooks/useAdminOrders";

/** IMEI : 15 chiffres, dernier chiffre de contrôle (Luhn), comme côté API. */
function imeiProblem(value: string): string | null {
  const v = value.replace(/\s+/g, "").toUpperCase();
  if (!v) return null;
  if (/^[0-9]{15}$/.test(v)) {
    let sum = 0;
    [...v].reverse().forEach((c, i) => {
      let d = Number(c);
      if (i % 2 === 1) d = Math.floor((d * 2) / 10) + ((d * 2) % 10);
      sum += d;
    });
    return sum % 10 === 0 ? null : "IMEI invalide : vérifiez les 15 chiffres.";
  }
  return /^[A-Z0-9][A-Z0-9./-]{3,39}$/.test(v) ? null : "4 à 40 lettres ou chiffres.";
}

/**
 * Numéros de série / IMEI des unités (politique de garantie) : saisis par le revendeur en charge ou
 * l'équipe avant le départ en livraison, imprimés sur la facture et le reçu. Après la livraison,
 * seule l'équipe peut les corriger.
 */
export function SerialNumbersCard({ order }: { order: Order }) {
  const lines = order.items.filter((it) => it.serialRequired || (it.serials?.length ?? 0) > 0);
  const canAdvance = useCan("orders.status.advance");
  const isStaff = useCan("orders.assign");
  if (lines.length === 0) return null;
  const editable = canAdvance && order.status !== "annulee" && order.status !== "retournee" && (order.status !== "livree" || isStaff);
  return (
    <Reveal>
      <Block pad="sm">
        <h3 className="mb-1 flex items-center gap-2 text-[15px]">
          <span className="grid size-8 place-items-center rounded-full bg-primary-50 text-primary"><Tag size={17} variant="Bold" /></span>
          Numéros de série / IMEI
        </h3>
        <p className="mb-3 text-[12px] leading-[17px] text-ink-3">Un numéro par unité, avant le départ en livraison. Ils figurent sur la facture et le reçu : un retour doit porter le même numéro.</p>
        <div className="space-y-4">
          {lines.map((it) => (
            <SerialLine key={it.id} orderId={order.id} item={it} editable={editable} />
          ))}
        </div>
      </Block>
    </Reveal>
  );
}

function SerialLine({ orderId, item, editable }: { orderId: number; item: OrderItem; editable: boolean }) {
  const saved = item.serials ?? [];
  const [values, setValues] = useState<string[]>(() => Array.from({ length: item.quantity }, (_, i) => saved[i] ?? ""));
  const record = useRecordSerials(orderId);
  const problems = values.map(imeiProblem);
  const filled = saved.length;
  const changed = values.map((v) => v.replace(/\s+/g, "").toUpperCase()).filter(Boolean).join("|") !== saved.join("|");
  const save = () =>
    record.mutate(
      { itemId: item.id, serials: values.filter((v) => v.trim()) },
      {
        onSuccess: () => toast.success("Numéros enregistrés", "Ils seront imprimés sur la facture et le reçu."),
        onError: (e) => toast.error("Enregistrement impossible", getErrorMessage(e)),
      },
    );
  return (
    <div>
      <p className="mb-1.5 flex items-baseline justify-between gap-2 text-[13px]">
        <span className="font-semibold">{item.productName}{item.variantLabel ? ` — ${item.variantLabel}` : ""}</span>
        <span className={filled < item.quantity && item.serialRequired ? "text-danger" : "text-ink-3"}>
          {filled}/{item.quantity}
        </span>
      </p>
      {editable ? (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {values.map((v, i) => (
              <Input
                key={i}
                aria-label={`Numéro de série de l'unité ${i + 1}`}
                placeholder={`Unité ${i + 1} — IMEI ou n° de série`}
                value={v}
                error={problems[i] ?? undefined}
                onChange={(e) => setValues((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))}
              />
            ))}
          </div>
          <Button size="sm" variant="outline" upper={false} className="mt-2" disabled={!changed || problems.some(Boolean)} loading={record.isPending} onClick={save}>
            Enregistrer
          </Button>
        </>
      ) : saved.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5 text-[13px]">
          {saved.map((s) => (
            <li key={s} className="rounded-md bg-page/70 px-2 py-1 font-mono">{s}</li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-ink-3">Pas encore saisis.</p>
      )}
    </div>
  );
}
