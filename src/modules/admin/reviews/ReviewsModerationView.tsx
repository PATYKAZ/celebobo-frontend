"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Star1 } from "@/shared/ui/icons";
import { ENDPOINTS } from "@/config/endpoints";
import { ROUTES } from "@/config/routes";
import { Pill } from "@/shared/ui/Badges";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Input, Select } from "@/shared/ui/Form";
import { Pagination } from "@/shared/ui/Pagination";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Stars } from "@/shared/ui/Stars";
import { toast } from "@/shared/ui/Toast";
import { api, getErrorMessage } from "@/shared/lib/api";
import { formatDateTime } from "@/shared/lib/format";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { PageHeader } from "../ui/PageHeader";
import { useAdminPage } from "../ui/paged";

type Status = "published" | "hidden";

interface Review {
  id: number;
  product: { id: number; slug: string; name: string };
  author: { id: number; name: string; avatar: string | null };
  rating: number;
  message: string;
  status: Status;
  verified: boolean;
  createdAt: string;
}

function Row({ r }: { r: Review }) {
  const qc = useQueryClient();
  const next: Status = r.status === "published" ? "hidden" : "published";
  const moderate = useMutation({
    mutationFn: () => api.patch(ENDPOINTS.admin.reviews.detail(r.id), { status: next }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
      toast.success(next === "hidden" ? "Avis masqué" : "Avis publié");
    },
    onError: (e) => toast.error("Modération impossible", getErrorMessage(e)),
  });
  return (
    <li className="space-y-1.5 px-4 py-3.5 text-[13px] sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-2">
          <Stars rating={r.rating} hideCount />
          <b>{r.author.name}</b>
          {r.verified && <Pill tone="green">Achat vérifié</Pill>}
        </span>
        {r.status === "hidden" && <Pill tone="gray">Masqué</Pill>}
      </div>
      <p className="text-ink-3">
        <Link href={ROUTES.product(r.product.slug)} className="text-primary hover:underline">{r.product.name}</Link> · {formatDateTime(r.createdAt)}
      </p>
      {r.message && <p className="whitespace-pre-line text-ink-2">{r.message}</p>}
      <Button size="sm" variant={next === "hidden" ? "outline" : "primary"} upper={false} loading={moderate.isPending} onClick={() => moderate.mutate()}>
        {next === "hidden" ? "Masquer" : "Publier"}
      </Button>
    </li>
  );
}

function Content() {
  const [status, setStatus] = useState<Status | "all">("all");
  const [rating, setRating] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminPage<Review>("reviews", ENDPOINTS.admin.reviews.list, { status: status === "all" ? undefined : status, rating, search: search.trim() }, page);
  return (
    <>
      <PageHeader title="Avis clients" description="Les avis sont publiés dès leur envoi ; masquez ceux qui sont injurieux ou hors sujet." />
      <Block pad="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 pt-4 sm:px-6">
          <SegmentedControl size="sm" aria-label="Statut" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: "all", label: "Tous" }, { value: "published", label: "Publiés" }, { value: "hidden", label: "Masqués" }]} />
          <Select aria-label="Note" wrapperClassName="w-40" value={rating} onChange={(e) => { setRating(e.target.value); setPage(1); }} options={[{ value: "", label: "Toutes les notes" }, ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} étoile${n > 1 ? "s" : ""}` }))]} />
          <Input aria-label="Rechercher" placeholder="Produit, client, texte…" wrapperClassName="w-full sm:ml-auto sm:w-64" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        {isLoading || !data ? (
          <Skeleton className="m-4 h-40 rounded-box!" />
        ) : data.results.length === 0 ? (
          <EmptyState icon={<Star1 size={40} />} title="Aucun avis" description="Rien dans cette liste." />
        ) : (
          <ul className="divide-y divide-line-3">{data.results.map((r) => <Row key={r.id} r={r} />)}</ul>
        )}
        {data && <Pagination className="py-4" page={page} pageCount={data.meta.totalPages} onChange={setPage} />}
      </Block>
    </>
  );
}

export function ReviewsModerationView() {
  return (
    <PermissionGuard permission="reviews.moderate">
      <Content />
    </PermissionGuard>
  );
}
