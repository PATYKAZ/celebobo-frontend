import { cn } from "@/shared/lib/cn";
import { METHOD_STYLE, type PaymentMethod } from "../types";

export function MethodBadge({ method }: { method: PaymentMethod }) {
  const m = METHOD_STYLE[method];
  // pastille de la couleur du moyen de paiement + libellé : dans un tableau, des étiquettes pleines vives se disputent l'attention
  const dot = m.cls.split(" ").filter((c) => c.startsWith("bg-")).join(" ");
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm">
      <span className={cn("size-2 shrink-0 rounded-full", dot)} />
      {m.label}
    </span>
  );
}
