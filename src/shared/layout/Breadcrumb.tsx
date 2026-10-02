import Link from "next/link";
import { ROUTES } from "@/config/routes";
import { Block } from "@/shared/ui/Block";

export interface Crumb {
  label: string;
  href?: string;
}

/** Fil d'Ariane (bloc blanc 1300×81, rad 10) : liens #999, séparateur #6C757D, page courante #000. */
export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  const all: Crumb[] = [{ label: "Accueil", href: ROUTES.home }, ...items];
  return (
    <Block pad="none" as="div" className={`flex min-h-[44px] items-center px-4 py-2.5 sm:min-h-[81px] sm:px-[30px] sm:py-4 ${className ?? ""}`}>
      <nav aria-label="Fil d'Ariane" className="min-w-0">
        <ol className="flex min-w-0 items-center whitespace-nowrap text-[13px] font-bold leading-[21px] sm:flex-wrap sm:text-[14px]">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={`${c.label}-${i}`} className={`flex min-w-0 items-center ${i < all.length - 2 ? "max-sm:hidden" : ""}`}>
                {last || !c.href ? (
                  <span aria-current={last ? "page" : undefined} className={`${last ? "text-ink" : "text-ink-3"} max-sm:truncate`}>
                    {c.label}
                  </span>
                ) : (
                  <Link href={c.href} className="py-1 text-ink-3 transition-colors hover:text-primary">
                    {c.label}
                  </Link>
                )}
                {!last && <span className="mx-2 shrink-0 text-[#6C757D]">/</span>}
              </li>
            );
          })}
        </ol>
      </nav>
    </Block>
  );
}
