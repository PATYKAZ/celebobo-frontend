import { cn } from "@/shared/lib/cn";
import { METHOD_STYLE, type PaymentMethod } from "../types";

export function MethodBadge({ method }: { method: PaymentMethod }) {
  const m = METHOD_STYLE[method];
  return <span className={cn("inline-block whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold", m.cls)}>{m.label}</span>;
}
