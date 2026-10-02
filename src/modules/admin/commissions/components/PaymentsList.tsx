import { MoneyRecive } from "iconsax-reactjs";
import { RevealGroup, RevealItem } from "@/shared/animations/Reveal";
import { formatDateTime, formatPrice } from "@/shared/lib/format";
import type { CommissionPayment } from "../types";

/** Liste chronologique de paiements (tiroir admin et espace revendeur). */
export function PaymentsList({ payments, showReseller }: { payments: CommissionPayment[]; showReseller?: boolean }) {
  if (payments.length === 0) return <p className="rounded-box bg-chip p-6 text-center text-[13px] text-ink-3">Aucun paiement enregistré pour le moment.</p>;
  return (
    <RevealGroup stagger={0.05} className="flex flex-col gap-2.5">
      {payments.map((p) => (
        <RevealItem key={p.id} className="flex items-center gap-3 rounded-box border border-line-3 p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-100 text-primary-dark"><MoneyRecive size={18} variant="Bold" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold leading-[18px]">{showReseller ? `${p.resellerName} · ` : ""}{formatDateTime(p.paidAt)}</span>
            <span className="block truncate text-[12px] text-ink-3">{p.note ?? "—"} · par {p.paidByName}</span>
          </span>
          <strong className="text-[15px] text-primary">{formatPrice(p.amount)}</strong>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
