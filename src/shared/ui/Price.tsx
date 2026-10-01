import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";

interface Props {
  current: number;
  original?: number | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const CUR = { sm: "text-[16px] leading-[19px]", md: "text-[18px] leading-[21.6px]", lg: "text-[22px] leading-[26.4px]", xl: "text-[30px] leading-[36px]" };
const OLD = { sm: "text-[13px]", md: "text-[14px] leading-[16.8px]", lg: "text-[16px] leading-[19.2px]", xl: "text-[18px]" };

/** Prix du design : rouge si promo + ancien prix barré. */
export function Price({ current, original, size = "md", className }: Props) {
  const sale = original != null && original > current;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-[6px]", className)}>
      <span className={cn("font-semibold", CUR[size], sale ? "text-danger" : "text-ink")}>{formatPrice(current)}</span>
      {sale && <span className={cn("font-semibold text-ink-2 line-through", OLD[size])}>{formatPrice(original)}</span>}
    </div>
  );
}
