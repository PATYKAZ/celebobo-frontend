import Link from "next/link";
import { Bag2 } from "@/shared/ui/icons";
import { ROUTES } from "@/config/routes";
import { SITE } from "@/config/site";
import { cn } from "@/shared/lib/cn";

/**
 * Logo de la marque, redessiné d'après celui que les clients connaissent : « CeLE BoBO » (casse d'origine)
 * entre deux traits. En couleur du texte : foncé en mode clair, clair en mode sombre.
 */
function Wordmark({ light }: { light?: boolean }) {
  return (
    <span aria-hidden className={cn("inline-flex flex-col gap-[3px]", light ? "text-white" : "text-ink")}>
      <span className="h-[2px] rounded-full bg-current" />
      <span className="whitespace-nowrap px-[3px] text-[21px] font-bold leading-[22px] tracking-[0.03em]">CeLE BoBO</span>
      <span className="h-[2px] rounded-full bg-current" />
    </span>
  );
}

/** Logo Celebobo : carré arrondi vert (sac) + logo de la marque. */
export function Logo({ className, light, compact }: { className?: string; light?: boolean; compact?: boolean }) {
  return (
    <Link href={ROUTES.home} aria-label={`${SITE.name} — accueil`} className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="relative grid size-10 place-items-center rounded-[12px] bg-primary text-white transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-105">
        <Bag2 size={22} variant="Bold" />
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-sun ring-2 ring-surface" />
      </span>
      {!compact && <Wordmark light={light} />}
    </Link>
  );
}
