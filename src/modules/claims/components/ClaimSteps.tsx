import { formatDate, formatDateTime } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { METHOD_LABEL, OUTCOME_LABEL, type Claim } from "../types";

interface Step {
  title: string;
  at: string | null;
  detail?: string | null;
}

/** Les étapes d'une réclamation, comme la politique de garantie les décrit. */
export function claimSteps(c: Claim): Step[] {
  const steps: Step[] = [
    { title: "Réclamation envoyée", at: c.createdAt, detail: `Réponse sous 72 heures, au plus tard le ${formatDateTime(c.answerDue)}.` },
    {
      title: "Retour du produit",
      at: c.answeredAt,
      detail: c.returnMethod ? [METHOD_LABEL[c.returnMethod], c.answerNote].filter(Boolean).join(" — ") : null,
    },
    {
      title: `Produit reçu — bon de dépôt ${c.number}`,
      at: c.receivedAt,
      detail: c.diagnosisDue && !c.diagnosedAt ? `Diagnostic sous 3 jours ouvrables, au plus tard le ${formatDateTime(c.diagnosisDue)}.` : null,
    },
    {
      title: c.outcome ? `Diagnostic : ${OUTCOME_LABEL[c.outcome]}` : "Diagnostic",
      at: c.diagnosedAt,
      detail:
        [
          c.diagnosisNote,
          c.outcome === "repair" && c.outcomeDue && !c.repairedAt ? `Réparation sous 10 jours ouvrables, au plus tard le ${formatDate(c.outcomeDue)}.` : null,
          c.outcome === "refund" && c.outcomeDue ? `Remboursement sous 15 jours, au plus tard le ${formatDate(c.outcomeDue)}.` : null,
          c.outcome === "exchange" && c.exchangeWarrantyUntil ? `Nouveau produit${c.newSerial ? ` (${c.newSerial})` : ""} garanti jusqu'au ${formatDate(c.exchangeWarrantyUntil)}.` : null,
          c.quote ? `Devis pour une réparation payante : ${c.quote} $.` : null,
        ]
          .filter(Boolean)
          .join(" ") || null,
    },
  ];
  if (c.outcome === "repair") steps.push({ title: "Réparation terminée", at: c.repairedAt, detail: c.repairedAt ? "La garantie est prolongée du temps passé en réparation." : null });
  return steps;
}

export function ClaimSteps({ claim }: { claim: Claim }) {
  return (
    <ol className="space-y-3">
      {claimSteps(claim).map((s) => (
        <li key={s.title} className="flex gap-3">
          <span className={cn("mt-1 size-3 shrink-0 rounded-full border-2", s.at ? "border-primary bg-primary" : "border-line-3 bg-white")} aria-hidden />
          <div className="min-w-0 text-sm">
            <p className={cn("font-semibold", !s.at && "text-ink-3")}>{s.title}</p>
            {s.at && <p className="text-xs text-ink-3">{formatDateTime(s.at)}</p>}
            {s.detail && <p className="mt-0.5 text-ink-2">{s.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
