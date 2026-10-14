import Link from "next/link";
import { ROUTES } from "@/config/routes";
import { SITE } from "@/config/site";
import { cn } from "@/shared/lib/cn";
import { LogoMark } from "./LogoMark";

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

/** Logo Celebobo : pictogramme (sac aux deux traits) + logo de la marque. */
export function Logo({ className, light, compact }: { className?: string; light?: boolean; compact?: boolean }) {
  return (
    <Link href={ROUTES.home} aria-label={`${SITE.name} — accueil`} className={cn("group inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-10 shrink-0 transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-105" />
      {!compact && <Wordmark light={light} />}
    </Link>
  );
}
