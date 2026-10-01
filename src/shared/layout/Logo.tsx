import Link from "next/link";
import { Bag2 } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { SITE } from "@/config/site";
import { cn } from "@/shared/lib/cn";

/** Logo Celebobo : carré arrondi vert + wordmark. */
export function Logo({ className, light, compact }: { className?: string; light?: boolean; compact?: boolean }) {
  return (
    <Link href={ROUTES.home} aria-label={`${SITE.name} — accueil`} className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="relative grid size-10 place-items-center rounded-[12px] bg-primary text-white transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-105">
        <Bag2 size={22} variant="Bold" />
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-sun ring-2 ring-white" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={cn("text-[21px] font-extrabold tracking-tight", light ? "text-white" : "text-ink")}>{SITE.name}</span>
          <span className={cn("mt-1 text-[10px] font-medium uppercase tracking-[0.18em]", light ? "text-white/70" : "text-ink-3")}>{SITE.tagline}</span>
        </span>
      )}
    </Link>
  );
}
