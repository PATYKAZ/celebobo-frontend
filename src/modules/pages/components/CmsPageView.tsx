"use client";

import Link from "next/link";
import { ArrowRight2, DocumentText } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { Reveal } from "@/shared/animations/Reveal";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { usePage, usePages } from "../hooks/usePages";
import { DEDICATED_PAGES } from "../types";
import { Markdown } from "./Markdown";

const pageHref = (slug: string) => DEDICATED_PAGES[slug] ?? ROUTES.page(slug);

/** Page de contenu générique (conditions, retours…) alimentée par le back-office. */
export function CmsPageView({ slug }: { slug: string }) {
  const { data: page, isLoading, isError } = usePage(slug);
  const { data: pages } = usePages();

  return (
    <>
      <Breadcrumb items={[{ label: page?.title ?? "Informations" }]} />
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Reveal className="min-w-0">
          <Block pad="none" className="p-4 sm:p-[30px] lg:p-[40px]">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-24" />
              </div>
            ) : isError || !page ? (
              <EmptyState icon={<DocumentText size={44} variant="Bulk" />} title="Page introuvable" description="Cette page n'existe pas ou n'est plus publiée." action={<Button href={ROUTES.home}>Retour à l&apos;accueil</Button>} />
            ) : (
              <article>
                <span className="inline-block rounded-full bg-primary-50 px-4 py-1.5 text-[12px] font-bold uppercase tracking-wider text-primary">Informations</span>
                <h1 className="mt-4 text-[26px] font-extrabold leading-[32px] sm:text-[36px] sm:leading-[44px]">{page.title}</h1>
                {page.summary && <p className="mt-2 text-[15px] leading-[24px] text-ink-2 sm:text-[16px]">{page.summary}</p>}
                <p className="mt-2 text-[12px] text-ink-3">Mis à jour le {formatDate(page.updatedAt)}</p>
                <Markdown source={page.body} className="mt-6 border-t border-line-3 pt-6" />
              </article>
            )}
          </Block>
        </Reveal>
        {!!pages?.length && (
          <Reveal delay={0.1} className="min-w-0">
            <Block pad="sm" className="!p-2 lg:sticky lg:top-4">
              <p className="px-3 pb-1 pt-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Informations utiles</p>
              {pages.map((p) => (
                <Link key={p.slug} href={pageHref(p.slug)} aria-current={p.slug === slug ? "page" : undefined} className={cn("group flex min-h-12 items-center gap-3 rounded-box px-3 py-2 text-[14px] font-semibold transition-colors hover:bg-chip", p.slug === slug && "bg-primary-50 text-primary-dark")}>
                  <span className="min-w-0 flex-1">
                    <span className="block">{p.title}</span>
                    {p.summary && <span className="block text-[12px] font-normal text-ink-3">{p.summary}</span>}
                  </span>
                  <ArrowRight2 size={14} className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </Block>
          </Reveal>
        )}
      </div>
    </>
  );
}
