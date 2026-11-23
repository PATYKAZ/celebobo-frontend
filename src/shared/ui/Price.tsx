import { cn } from "@/shared/lib/cn";
import { formatPrice as formatUsd } from "@/shared/lib/format";
import { useFormatPrice } from "@/shared/currency/CurrencyProvider";

interface Props {
  current: number;
  original?: number | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /** Toujours en USD (panier, commande : ce qui est réellement payé), quelle que soit la devise d'affichage. */
  usd?: boolean;
}

const CUR = { sm: "text-base", md: "text-lg", lg: "text-xl", xl: "text-2xl" };
const OLD = { sm: "text-sm", md: "text-sm", lg: "text-base", xl: "text-lg" };

/** Prix du design : rouge si promo + ancien prix barré. */
export function Price({ current, original, size = "md", className, usd }: Props) {
  const display = useFormatPrice();
  const formatPrice = usd ? formatUsd : display;
  const sale = original != null && original > current;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-1.5", className)}>
      <span className={cn("font-semibold", CUR[size], sale ? "text-danger" : "text-ink")}>{formatPrice(current)}</span>
      {sale && <span className={cn("font-semibold text-ink-2 line-through", OLD[size])}>{formatPrice(original)}</span>}
    </div>
  );
}
