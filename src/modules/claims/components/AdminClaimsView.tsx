"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft2, ShieldTick } from "@/shared/ui/icons";
import { ROUTES } from "@/config/routes";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Checkbox, Input, Select, Textarea } from "@/shared/ui/Form";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { getErrorMessage } from "@/shared/lib/api";
import { formatDateTime } from "@/shared/lib/format";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { PageHeader } from "@/modules/admin/ui/PageHeader";
import { useClaim, useClaims, useClaimStep } from "../hooks/useClaims";
import { METHOD_LABEL, OUTCOME_LABEL, STATUS_LABEL, outcomesFor, type Claim, type ClaimOutcome, type ClaimStatus, type ReturnMethod } from "../types";
import { ClaimSteps } from "./ClaimSteps";

const FILTERS: (ClaimStatus | "all")[] = ["all", "submitted", "answered", "received", "repairing", "closed"];

function List() {
  const [status, setStatus] = useState<ClaimStatus | "all">("submitted");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useClaims(status, page);
  return (
    <Block pad="none" className="overflow-hidden">
      <div className="flex flex-wrap gap-2 border-b border-line-3 p-3 sm:p-4">
        {FILTERS.map((f) => (
          <Button key={f} size="sm" variant={f === status ? "primary" : "chip"} upper={false} onClick={() => { setStatus(f); setPage(1); }}>
            {f === "all" ? "Toutes" : STATUS_LABEL[f]}
          </Button>
        ))}
      </div>
      {isLoading || !data ? (
        <Skeleton className="m-4 h-40 rounded-box!" />
      ) : data.results.length === 0 ? (
        <EmptyState icon={<ShieldTick size={40} />} title="Aucune réclamation" description="Rien à traiter dans cette liste." />
      ) : (
        <ul className="divide-y divide-line-3">
          {data.results.map((c) => (
            <li key={c.id}>
              <Link href={ROUTES.admin.claim(c.id)} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-page/60 sm:px-6">
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold">{c.number} · {c.productName}</span>
                  <span className="block text-[12px] text-ink-3">{c.clientName} · {c.kindLabel} · {formatDateTime(c.createdAt)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {c.overdue && <span className="rounded-full bg-danger-100 px-2 py-0.5 text-[11px] font-bold text-danger">En retard</span>}
                  <span className="rounded-full bg-chip px-2.5 py-1 text-[12px] font-semibold">{c.status === "closed" && c.outcome ? OUTCOME_LABEL[c.outcome] : STATUS_LABEL[c.status]}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {data?.next && <div className="p-3"><Button variant="outline" size="sm" upper={false} onClick={() => setPage((p) => p + 1)}>Voir plus</Button></div>}
    </Block>
  );
}

export function AdminClaimsView() {
  return (
    <PermissionGuard permission="claims.manage">
      <PageHeader title="Réclamations" description="Réponse sous 72 heures, diagnostic sous 3 jours ouvrables après réception, réparation sous 10 jours ouvrables, remboursement sous 15 jours." />
      <List />
    </PermissionGuard>
  );
}

function Actions({ claim }: { claim: Claim }) {
  const steps = useClaimStep(claim.id);
  const [method, setMethod] = useState<ReturnMethod>("shop");
  const [note, setNote] = useState("");
  const [sealed, setSealed] = useState(false);
  const [covered, setCovered] = useState(true);
  const [outcome, setOutcome] = useState<ClaimOutcome>(outcomesFor(claim.kind, true)[0]);
  const [newSerial, setNewSerial] = useState("");
  const [quote, setQuote] = useState("");
  const fail = (e: unknown) => toast.error("Action impossible", getErrorMessage(e));
  const ok = (title: string) => () => { setNote(""); toast.success(title, "Le client est prévenu."); };
  const choices = outcomesFor(claim.kind, covered);

  if (claim.status === "submitted" || claim.status === "answered") {
    return (
      <div className="space-y-3">
        {claim.status === "submitted" && (
          <>
            <Select label="Retour du produit" value={method} onChange={(e) => setMethod(e.target.value as ReturnMethod)} options={(Object.keys(METHOD_LABEL) as ReturnMethod[]).map((m) => ({ value: m, label: METHOD_LABEL[m] }))} />
            <Textarea label="Message au client (facultatif)" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[70px]" />
            <Button fullWidth upper={false} loading={steps.answer.isPending} onClick={() => steps.answer.mutate({ method, note }, { onSuccess: ok("Réponse envoyée"), onError: fail })}>Répondre au client</Button>
          </>
        )}
        <div className="border-t border-line-3 pt-3">
          <Checkbox label="Le scellé est intact (produits repris sous scellé)" checked={sealed} onChange={(e) => setSealed(e.target.checked)} />
          <Button fullWidth variant={claim.status === "answered" ? "primary" : "outline"} upper={false} className="mt-2" loading={steps.receive.isPending} onClick={() => steps.receive.mutate({ sealed, note: "" }, { onSuccess: ok("Produit reçu"), onError: fail })}>Produit reçu : émettre le bon de dépôt</Button>
        </div>
      </div>
    );
  }
  if (claim.status === "received") {
    return (
      <div className="space-y-3">
        <Select label="Diagnostic" value={covered ? "yes" : "no"} onChange={(e) => { const c = e.target.value === "yes"; setCovered(c); setOutcome(outcomesFor(claim.kind, c)[0]); }} options={[{ value: "yes", label: "Couvert par la garantie" }, { value: "no", label: "Non couvert" }]} />
        <Select label="Solution" value={outcome} onChange={(e) => setOutcome(e.target.value as ClaimOutcome)} options={choices.map((o) => ({ value: o, label: OUTCOME_LABEL[o] }))} />
        {outcome === "exchange" && <Input label="N° de série / IMEI du produit donné en échange" value={newSerial} onChange={(e) => setNewSerial(e.target.value)} />}
        {outcome === "not_covered" && <Input label="Devis de réparation payante ($, facultatif)" type="number" min="0" step="0.01" value={quote} onChange={(e) => setQuote(e.target.value)} />}
        {outcome === "refund" && <p className="text-[12px] leading-[17px] text-ink-3">L&apos;unité est retournée sur la commande : stock, points et remboursement dû suivent, à verser sous 15 jours.</p>}
        <Textarea label="Note du diagnostic" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[70px]" />
        <Button fullWidth upper={false} loading={steps.diagnose.isPending} onClick={() => steps.diagnose.mutate({ covered, outcome, note, newSerial, quote: quote || null }, { onSuccess: ok("Diagnostic enregistré"), onError: fail })}>Enregistrer le diagnostic</Button>
      </div>
    );
  }
  if (claim.status === "repairing") {
    return (
      <div className="space-y-3">
        <Textarea label="Note de réparation" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[70px]" />
        <Button fullWidth upper={false} loading={steps.repaired.isPending} onClick={() => steps.repaired.mutate(note, { onSuccess: ok("Réparation terminée"), onError: fail })}>Réparation terminée</Button>
      </div>
    );
  }
  return <p className="text-[13px] text-ink-3">Réclamation terminée.</p>;
}

function Detail({ id }: { id: number }) {
  const { data: c, isLoading, isError } = useClaim(id);
  if (isLoading) return <Skeleton className="h-72 w-full rounded-box!" />;
  if (isError || !c) return <EmptyState icon={<ShieldTick size={40} />} title="Réclamation introuvable" action={<Button href={ROUTES.admin.claims} size="sm" upper={false}>Retour</Button>} />;
  return (
    <>
      <PageHeader
        title={`Réclamation ${c.number}`}
        description={`${c.clientName} · ${c.productName}${c.serial ? ` · ${c.serial}` : ""}`}
        actions={<Button href={ROUTES.admin.claims} variant="chip" size="sm" upper={false} leftIcon={<ArrowLeft2 size={16} />}>Réclamations</Button>}
      />
      <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Block>
          <p className="mb-1 text-[13px] text-ink-3">
            <Link href={ROUTES.admin.order(c.orderId)} className="font-semibold text-primary underline">Commande {c.orderNumber}</Link> · {c.kindLabel} · protection : {c.protection === "trial" ? "délai d'essai" : c.protection === "warranty" ? "garantie CeLE BoBO" : "authenticité"}
            {c.overdue && <span className="ml-2 rounded-full bg-danger-100 px-2 py-0.5 text-[11px] font-bold text-danger">En retard</span>}
          </p>
          <p className="mb-4 rounded-box bg-page/70 p-3.5 text-[14px] leading-[20px]">{c.description}</p>
          {c.photos.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {c.photos.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="relative size-24 overflow-hidden rounded-md bg-page">
                  <Image src={url} alt="Photo du défaut" fill sizes="96px" className="object-cover" />
                </a>
              ))}
            </div>
          )}
          <ClaimSteps claim={c} />
        </Block>
        <Block pad="sm">
          <h3 className="mb-3 text-[15px]">Étape suivante</h3>
          <Actions key={`${c.status}-${c.outcome ?? ""}`} claim={c} />
        </Block>
      </div>
    </>
  );
}

export function AdminClaimDetailView({ id }: { id: number }) {
  return (
    <PermissionGuard permission="claims.manage">
      <Detail id={id} />
    </PermissionGuard>
  );
}
