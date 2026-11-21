"use client";

import { cn } from "@/shared/lib/cn";
import { formatDate, formatDateTime, formatPrice } from "@/shared/lib/format";
import { StatusDot } from "@/shared/ui/Badges";
import { Button } from "@/shared/ui/Button";
import { Drawer } from "@/shared/ui/Overlay";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useStatement } from "../hooks/useCommissions";
import type { PayoutStatement, StatementLineKind } from "../types";
import { payoutDay, STATEMENT_STATUS } from "./StatementsList";

const LINE_LABEL: Record<StatementLineKind, string> = {
  commission: "Commission validée",
  reversal: "Déduction",
  delivery_fee: "Frais de livraison",
  delivery_fee_reversal: "Frais de livraison repris",
};

/** Détail d'un relevé : commissions validées par vente, déductions, frais de livraison, total. */
export function StatementDrawer({ id, onClose, onPay }: { id: number | null; onClose: () => void; onPay?: (statement: PayoutStatement) => void }) {
  const { data, isLoading } = useStatement(id);
  const status = data ? STATEMENT_STATUS[data.status] : null;
  return (
    <Drawer open={id != null} onClose={onClose} title={data ? `Relevé du ${payoutDay(data.payoutDate)}` : "Relevé de paiement"} side="right" className="sm:max-w-[480px]">
      <div className="p-5">
        {isLoading || !data ? (
          <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[14px] text-ink-2"><strong className="text-ink">{data.resellerName}</strong></p>
              {status && <StatusDot tone={status.tone}>{status.label}</StatusDot>}
            </div>
            <div className="mb-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-box bg-chip p-3"><p className="text-[11px] uppercase text-ink-3">Commissions</p><p className="font-bold">{formatPrice(data.commissions)}</p></div>
              <div className="rounded-box bg-chip p-3"><p className="text-[11px] uppercase text-ink-3">Livraisons</p><p className="font-bold">{formatPrice(data.deliveryFees)}</p></div>
              <div className="rounded-box bg-primary-50 p-3"><p className="text-[11px] uppercase text-ink-3">Total</p><p className="font-bold text-primary">{formatPrice(data.total)}</p></div>
            </div>
            <p className="mb-3 text-[12px] text-ink-3">
              Préparé le {formatDateTime(data.preparedAt)}
              {data.paidAt ? ` · payé le ${formatDate(data.paidAt)}` : ""}
            </p>
            <ul className="divide-y divide-line-3 rounded-box border border-line-3">
              {data.lines.map((line, index) => (
                <li key={index} className="flex items-start gap-3 p-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold leading-[18px]">{line.title}</span>
                    <span className="block text-[12px] text-ink-3">
                      {LINE_LABEL[line.kind]}
                      {line.orderNumber ? ` · commande ${line.orderNumber}` : ""}
                      {line.baseAmount != null && line.kind === "commission" ? ` · sur ${formatPrice(line.baseAmount)}` : ""}
                      {` · ${formatDate(line.at)}`}
                    </span>
                  </span>
                  <strong className={cn("text-[14px]", line.amount < 0 ? "text-danger" : "text-ink")}>{formatPrice(line.amount)}</strong>
                </li>
              ))}
              {data.lines.length === 0 && <li className="p-4 text-center text-[13px] text-ink-3">Ce relevé a été remplacé par un relevé plus récent.</li>}
            </ul>
            {onPay && data.status === "prepared" && (
              <Button className="mt-5" fullWidth upper={false} onClick={() => onPay(data)}>Marquer comme payé</Button>
            )}
          </>
        )}
      </div>
    </Drawer>
  );
}
