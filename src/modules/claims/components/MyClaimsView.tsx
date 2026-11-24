"use client";

import { AccountShell } from "@/modules/account/components/AccountShell";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ShieldTick } from "@/shared/ui/icons";
import { ROUTES } from "@/config/routes";
import { Reveal } from "@/shared/animations/Reveal";
import { Breadcrumb } from "@/shared/layout/Breadcrumb";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { AccountSkeleton } from "@/shared/ui/PageSkeletons";
import { Skeleton } from "@/shared/ui/Skeleton";
import { formatDate } from "@/shared/lib/format";
import { AuthGuard } from "@/modules/auth/components/AuthGuard";
import { useMyClaim, useMyClaims } from "../hooks/useClaims";
import { OUTCOME_LABEL, STATUS_LABEL } from "../types";
import { ClaimSteps } from "./ClaimSteps";

function List() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyClaims(page);
  if (isLoading || !data) return <Skeleton className="h-40 w-full rounded-box!" />;
  if (data.results.length === 0) {
    return <EmptyState icon={<ShieldTick size={44} variant="Bulk" />} title="Aucune réclamation" description="Un produit défectueux, qui ne vous convient pas ou contrefait ? Ouvrez une réclamation depuis la commande livrée." action={<Button href={ROUTES.orders}>Mes commandes</Button>} />;
  }
  return (
    <>
      <ul className="divide-y divide-line-3 rounded-box border border-line-3">
        {data.results.map((c) => (
          <li key={c.id}>
            <Link href={ROUTES.myClaim(c.id)} className="flex items-center justify-between gap-3 p-3.5 hover:bg-page/60">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{c.number} · {c.productName}</span>
                <span className="block text-xs text-ink-3">{c.kindLabel} · {formatDate(c.createdAt)}</span>
              </span>
              <span className="shrink-0 rounded-full bg-chip px-2.5 py-1 text-xs font-semibold">{c.outcome && c.status === "closed" ? OUTCOME_LABEL[c.outcome] : STATUS_LABEL[c.status]}</span>
            </Link>
          </li>
        ))}
      </ul>
      {data.next && <Button variant="secondary" size="sm" upper={false} className="mt-3" onClick={() => setPage((p) => p + 1)}>Voir plus</Button>}
    </>
  );
}

export function MyClaimsView() {
  return (
    <>
      <Breadcrumb items={[{ label: "Mon compte", href: ROUTES.profile }, { label: "Mes réclamations" }]} />
      <AuthGuard fallback={<AccountSkeleton breadcrumb={false} />}>
        <AccountShell>
        <Reveal>
          <Block pad="none" className="p-4 sm:p-8">
            <h1 className="text-xl sm:text-h-page">Mes réclamations</h1>
            <p className="mb-4 mt-1 text-sm text-ink-2">Délai d&apos;essai de 7 jours, garantie CeLE BoBO d&apos;un mois et garantie d&apos;authenticité de 12 mois. Pour réclamer, ouvrez la commande livrée.</p>
            <List />
          </Block>
        </Reveal>
        </AccountShell>
      </AuthGuard>
    </>
  );
}

function Detail({ id }: { id: number }) {
  const { data: c, isLoading, isError } = useMyClaim(id);
  if (isLoading) return <Skeleton className="h-72 w-full rounded-box!" />;
  if (isError || !c) return <EmptyState icon={<ShieldTick size={44} />} title="Réclamation introuvable" action={<Button href={ROUTES.myClaims}>Mes réclamations</Button>} />;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-h-page">Réclamation {c.number}</h1>
        <p className="mt-1 text-sm text-ink-2">{c.productName}{c.serial ? ` · ${c.serial}` : ""} · commande {c.orderNumber}</p>
      </div>
      <p className="rounded-box bg-page/70 p-3.5 text-sm"><b>{c.kindLabel}</b> — {c.description}</p>
      {c.photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {c.photos.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="relative size-20 overflow-hidden rounded-md bg-page">
              <Image src={url} alt="Photo du défaut" fill sizes="80px" className="object-cover" />
            </a>
          ))}
        </div>
      )}
      <ClaimSteps claim={c} />
    </div>
  );
}

export function MyClaimView({ id }: { id: number }) {
  return (
    <>
      <Breadcrumb items={[{ label: "Mon compte", href: ROUTES.profile }, { label: "Mes réclamations", href: ROUTES.myClaims }, { label: "Détail" }]} />
      <AuthGuard fallback={<AccountSkeleton breadcrumb={false} />}>
        <AccountShell>
        <Reveal>
          <Block pad="none" className="p-4 sm:p-8">
            <Detail id={id} />
          </Block>
        </Reveal>
        </AccountShell>
      </AuthGuard>
    </>
  );
}
