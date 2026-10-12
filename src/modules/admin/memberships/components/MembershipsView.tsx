"use client";

import { useState } from "react";
import { Call, CloseCircle, Crown1, Sms, TickCircle } from "@/shared/ui/icons";
import { getErrorMessage } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Textarea } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { Pagination } from "@/shared/ui/Pagination";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { PLAN_LABEL, REQUEST_STATUS_LABEL, type MembershipRequestStatus, type MembershipStatus } from "@/modules/membership/types";
import { paymentMethod } from "@/modules/site";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { PageHeader } from "../../ui/PageHeader";
import { PAGE_SIZE, useHandleRequest, useMembers, useMembershipRequests, type AdminMembershipRequest, type MemberRef } from "../memberships";

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const dateTime = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const REQUEST_TABS: { value: MembershipRequestStatus | "all"; label: string }[] = [
  { value: "pending", label: "À confirmer" },
  { value: "confirmed", label: "Confirmées" },
  { value: "rejected", label: "Refusées" },
  { value: "all", label: "Toutes" },
];
const MEMBER_TABS: { value: MembershipStatus | "all"; label: string }[] = [
  { value: "active", label: "Abonnés" },
  { value: "trial", label: "Essai" },
  { value: "expired", label: "Terminés" },
  { value: "all", label: "Tous" },
];
const STATUS_TONE: Record<MembershipRequestStatus, string> = {
  pending: "bg-sun text-on-light",
  confirmed: "bg-primary text-white",
  rejected: "bg-danger text-white",
  cancelled: "bg-line-3 text-ink",
};

function Contact({ m }: { m: MemberRef }) {
  return (
    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-2">
      {m.phone && <a href={`tel:${m.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"><Call size={14} variant="Bold" /> {m.phone}</a>}
      <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 hover:text-primary"><Sms size={14} /> {m.email}</a>
    </p>
  );
}

function RequestRow({ r, onConfirm, onReject }: { r: AdminMembershipRequest; onConfirm: () => void; onReject: () => void }) {
  const method = paymentMethod(r.paymentMethod);
  return (
    <li className="flex flex-col gap-3 rounded-box border border-line-3 p-3 sm:flex-row sm:items-center sm:p-4">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold">{r.member.name || r.member.email}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", STATUS_TONE[r.status])}>{REQUEST_STATUS_LABEL[r.status]}</span>
        </p>
        <Contact m={r.member} />
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="font-semibold">Formule {PLAN_LABEL[r.plan].toLowerCase()}</span>
          <strong className="text-[15px] text-primary">{formatPrice(r.price)}</strong>
          <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", method.cls)}>{method.label}</span>
          <span className="text-ink-3">· demandée le {dateTime.format(new Date(r.createdAt))}</span>
        </p>
        {r.status === "rejected" && r.note && <p className="mt-1 text-[12px] text-ink-2">Motif : {r.note}</p>}
        {r.handledAt && r.status !== "pending" && <p className="mt-1 text-[12px] text-ink-3">Traitée le {dateTime.format(new Date(r.handledAt))}</p>}
      </div>
      {r.status === "pending" && (
        <div className="flex shrink-0 gap-2 max-sm:grid max-sm:grid-cols-2">
          <Button size="sm" variant="chip" upper={false} onClick={onReject} leftIcon={<CloseCircle size={16} />}>Refuser</Button>
          <Button size="sm" upper={false} onClick={onConfirm} leftIcon={<TickCircle size={16} variant="Bold" />}>Paiement reçu</Button>
        </div>
      )}
    </li>
  );
}

function Requests() {
  const [status, setStatus] = useState<MembershipRequestStatus | "all">("pending");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useMembershipRequests(status, page);
  const handle = useHandleRequest();
  const [confirming, setConfirming] = useState<AdminMembershipRequest | null>(null);
  const [rejecting, setRejecting] = useState<AdminMembershipRequest | null>(null);
  const [note, setNote] = useState("");

  const done = (title: string, r: AdminMembershipRequest) => toast.success(title, r.member.name || r.member.email);
  const fail = (e: unknown) => toast.error("Action impossible", getErrorMessage(e));

  return (
    <Block pad="none" className="p-3 sm:p-5">
      <div className="no-scrollbar mb-3 overflow-x-auto">
        <SegmentedControl aria-label="Statut des demandes" size="sm" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={REQUEST_TABS} />
      </div>
      {isLoading ? (
        <div className="grid gap-2.5">{[0, 1].map((i) => <Skeleton key={i} className="h-[110px] rounded-box!" />)}</div>
      ) : isError ? (
        <p className="py-6 text-center text-[14px] text-ink-2">{getErrorMessage(error, "Impossible de charger les demandes.")}</p>
      ) : !data?.results.length ? (
        <EmptyState icon={<Crown1 size={40} variant="Bulk" />} title={status === "pending" ? "Aucune demande à confirmer" : "Aucune demande"} description="Les demandes d'abonnement des clients arrivent ici, avec une notification." />
      ) : (
        <>
          <ul className="grid gap-2.5">
            {data.results.map((r) => (
              <RequestRow key={r.id} r={r} onConfirm={() => setConfirming(r)} onReject={() => { setNote(""); setRejecting(r); }} />
            ))}
          </ul>
          <Pagination page={page} pageCount={Math.ceil(data.count / PAGE_SIZE)} onChange={setPage} className="pt-4" />
        </>
      )}

      <ConfirmDialog
        open={!!confirming}
        onClose={() => setConfirming(null)}
        title="Confirmer le paiement ?"
        message={confirming ? `${formatPrice(confirming.price)} reçus de ${confirming.member.name || confirming.member.email} (${paymentMethod(confirming.paymentMethod).label}). L'abonnement ${PLAN_LABEL[confirming.plan].toLowerCase()} démarre aussitôt, ou à la fin de la période en cours, et le client est notifié.` : ""}
        confirmLabel="Confirmer"
        tone="primary"
        loading={handle.isPending}
        onConfirm={() => confirming && handle.mutate({ id: confirming.id, action: "confirm" }, { onSuccess: () => { done("Abonnement confirmé", confirming); setConfirming(null); }, onError: fail })}
      />
      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title="Refuser la demande" className="max-w-[480px]">
        <div className="grid gap-4">
          <p className="text-[14px] leading-[21px] text-ink-2">Le client est notifié avec votre message. Il pourra faire une nouvelle demande.</p>
          <Textarea label="Motif (envoyé au client)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={255} placeholder="Ex. Paiement non reçu après 48 h." />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="chip" upper={false} onClick={() => setRejecting(null)}>Annuler</Button>
            <Button variant="danger" upper={false} loading={handle.isPending} onClick={() => rejecting && handle.mutate({ id: rejecting.id, action: "reject", note }, { onSuccess: () => { done("Demande refusée", rejecting); setRejecting(null); }, onError: fail })}>
              Refuser la demande
            </Button>
          </div>
        </div>
      </Modal>
    </Block>
  );
}

function Members() {
  const [status, setStatus] = useState<MembershipStatus | "all">("active");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useMembers(status, page);
  return (
    <Block pad="none" className="p-3 sm:p-5">
      <div className="no-scrollbar mb-3 overflow-x-auto">
        <SegmentedControl aria-label="Statut des membres" size="sm" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={MEMBER_TABS} />
      </div>
      {isLoading ? (
        <div className="grid gap-2.5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[76px] rounded-box!" />)}</div>
      ) : isError ? (
        <p className="py-6 text-center text-[14px] text-ink-2">{getErrorMessage(error, "Impossible de charger les membres.")}</p>
      ) : !data?.results.length ? (
        <EmptyState icon={<Crown1 size={40} variant="Bulk" />} title="Aucun membre" description="Les clients en essai ou abonnés apparaissent ici." />
      ) : (
        <>
          <ul className="grid gap-2.5">
            {data.results.map((m) => {
              const ended = m.status === "expired";
              return (
                <li key={m.member.id} className="flex flex-col gap-1 rounded-box border border-line-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold">{m.member.name || m.member.email}</p>
                    <Contact m={m.member} />
                  </div>
                  <p className="text-[13px] sm:text-right">
                    <span className="font-semibold">{m.status === "trial" ? "Essai gratuit" : PLAN_LABEL[m.plan]}</span>
                    <span className="block text-ink-2">{ended ? "Terminé le" : "Jusqu’au"} {dateFmt.format(new Date(m.endsAt))}</span>
                  </p>
                </li>
              );
            })}
          </ul>
          <Pagination page={page} pageCount={Math.ceil(data.count / PAGE_SIZE)} onChange={setPage} className="pt-4" />
        </>
      )}
    </Block>
  );
}

function Content() {
  const [tab, setTab] = useState<"requests" | "members">("requests");
  return (
    <>
      <PageHeader
        title="Abonnements Celebobo Plus"
        description="Confirmez une demande dès que le paiement est reçu : l'abonnement démarre et le client est notifié. Refusez-la avec un message sinon."
      />
      <SegmentedControl aria-label="Vue" value={tab} onChange={setTab} options={[{ value: "requests", label: "Demandes" }, { value: "members", label: "Membres" }]} className="w-fit" />
      {tab === "requests" ? <Requests /> : <Members />}
    </>
  );
}

export function MembershipsView() {
  return (
    <PermissionGuard permission="membership.manage">
      <Content />
    </PermissionGuard>
  );
}
