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
    <Block pad="none" as="div" className={`flex min-h-[81px] items-center px-5 py-4 sm:px-[30px] ${className ?? ""}`}>
      <nav aria-label="Fil d'Ariane">
        <ol className="flex flex-wrap items-center text-[14px] font-bold leading-[21px]">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={`${c.label}-${i}`} className="flex items-center">
                {last || !c.href ? (
                  <span aria-current={last ? "page" : undefined} className={last ? "text-ink" : "text-ink-3"}>
                    {c.label}
                  </span>
                ) : (
                  <Link href={c.href} className="text-ink-3 transition-colors hover:text-primary">
                    {c.label}
                  </Link>
                )}
                {!last && <span className="mx-2 text-[#6C757D]">/</span>}
              </li>
            );
          })}
        </ol>
      </nav>
    </Block>
  );
}
