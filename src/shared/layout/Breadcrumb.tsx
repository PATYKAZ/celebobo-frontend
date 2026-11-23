import Link from "next/link";
import { ROUTES } from "@/config/routes";

export interface Crumb {
  label: string;
  href?: string;
}

/** Fil d'Ariane : simple ligne au-dessus du contenu (sans bloc), liens ink-3, page courante en ink. */
export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  const all: Crumb[] = [{ label: "Accueil", href: ROUTES.home }, ...items];
  return (
    <div className={`flex min-h-9 items-center px-1 sm:px-2 ${className ?? ""}`}>
      <nav aria-label="Fil d'Ariane" className="min-w-0">
        <ol className="flex min-w-0 items-center whitespace-nowrap text-sm font-medium sm:flex-wrap">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={`${c.label}-${i}`} className={`flex min-w-0 items-center ${i < all.length - 2 ? "max-sm:hidden" : ""}`}>
                {last || !c.href ? (
                  <span aria-current={last ? "page" : undefined} className={`${last ? "font-semibold text-ink" : "text-ink-3"} max-sm:truncate`}>
                    {c.label}
                  </span>
                ) : (
                  <Link href={c.href} className="inline-flex min-h-11 items-center text-ink-3 transition-colors hover:text-primary sm:min-h-9">
                    {c.label}
                  </Link>
                )}
                {!last && <span className="mx-2 shrink-0 text-ink-3">/</span>}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
