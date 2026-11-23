import { ReceiptItem } from "@/shared/ui/icons";
import { RevealGroup, RevealItem } from "@/shared/animations/Reveal";
import { formatDate, formatPrice } from "@/shared/lib/format";
import { StatusDot } from "@/shared/ui/Badges";
import { Button } from "@/shared/ui/Button";
import type { PayoutStatement, StatementStatus } from "../types";

/** Date ISO « yyyy-mm-dd » d'un relevé, lue à midi pour ne jamais changer de jour avec le fuseau. */
export const payoutDay = (iso: string) => formatDate(`${iso}T12:00:00`);

export const STATEMENT_STATUS: Record<StatementStatus, { label: string; tone: "orange" | "green" | "gray" }> = {
  prepared: { label: "À payer", tone: "orange" },
  paid: { label: "Payé", tone: "green" },
  cancelled: { label: "Remplacé", tone: "gray" },
};

interface Props {
  statements: PayoutStatement[];
  onOpen: (id: number) => void;
  showReseller?: boolean;
  /** Admin : marquer un relevé préparé comme payé */
  onPay?: (statement: PayoutStatement) => void;
  empty?: string;
}

/** Relevés de paiement (1er et 16 du mois) : espace revendeur, tiroir et écran admin. */
export function StatementsList({ statements, onOpen, showReseller, onPay, empty = "Aucun relevé pour le moment." }: Props) {
  if (statements.length === 0) return <p className="rounded-box bg-chip p-6 text-center text-sm text-ink-3">{empty}</p>;
  return (
    <RevealGroup stagger={0.05} className="flex flex-col gap-2.5">
      {statements.map((s) => (
        <RevealItem key={s.id} className="flex items-center gap-3 rounded-box border border-line-3 p-3">
          <button type="button" onClick={() => onOpen(s.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-100 text-primary-dark"><ReceiptItem size={18} variant="Bold" /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">
                {showReseller ? `${s.resellerName} · ` : ""}Paiement du {payoutDay(s.payoutDate)}
              </span>
              <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-3">
                <StatusDot tone={STATEMENT_STATUS[s.status].tone}>{STATEMENT_STATUS[s.status].label}</StatusDot>
                {s.deliveryFees !== 0 && <span>dont {formatPrice(s.deliveryFees)} de livraison</span>}
              </span>
            </span>
            <strong className="text-sm text-primary">{formatPrice(s.total)}</strong>
          </button>
          {onPay && s.status === "prepared" && (
            <Button size="xs" upper={false} className="max-md:min-h-11 max-md:px-5" onClick={() => onPay(s)}>
              Marquer payé
            </Button>
          )}
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
