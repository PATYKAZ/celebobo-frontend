"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Award, InfoCircle } from "@/shared/ui/icons";
import { ENDPOINTS } from "@/config/endpoints";
import { Pill } from "@/shared/ui/Badges";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Checkbox, Input, Select, Textarea } from "@/shared/ui/Form";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { api, getErrorMessage, idempotent } from "@/shared/lib/api";
import { formatDate, formatDateTime, formatPrice } from "@/shared/lib/format";
import { PermissionGuard, useCan } from "@/modules/auth/hooks/useCan";
import { PageHeader } from "../ui/PageHeader";

type Kind = "warning" | "suspension" | "exclusion";
type Status = "notified" | "applied" | "dropped";

interface Sanction {
  id: number;
  resellerId: number;
  resellerName: string;
  kind: Kind;
  kindLabel: string;
  reason: string;
  urgent: boolean;
  days: number | null;
  status: Status;
  explainUntil: string | null;
  explanation: string;
  explainedAt: string | null;
  decisionNote: string;
  decidedAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  active: boolean;
}

interface Standing {
  resellerId: number;
  resellerName: string;
  level: string;
  levelLabel: string;
  advantages: string;
  sales: string;
  rating: string | null;
  reviewedAt: string | null;
  nextLevel: string | null;
  nextSales: string | null;
  nextRating: string | null;
  suspendedUntil: string | null;
  sanctions: Sanction[];
}

interface Page<T> {
  results: T[];
  meta: { count: number };
}

const LEVEL: Record<string, string> = { debutant: "Débutant", confirme: "Confirmé", ambassadeur: "Ambassadeur" };
const STATUS: Record<Status, { label: string; tone: "yellow" | "red" | "gray" }> = {
  notified: { label: "En attente d'explication", tone: "yellow" },
  applied: { label: "Appliquée", tone: "red" },
  dropped: { label: "Abandonnée", tone: "gray" },
};
const keys = { all: ["standing"] as const, detail: (id: number | null) => ["standing", "detail", id] as const, sanctions: ["standing", "sanctions"] as const };

const waiting = (s: Sanction) => s.status === "notified" && !s.explainedAt && !!s.explainUntil && new Date(s.explainUntil) > new Date();

function LevelCard({ s }: { s: Standing }) {
  const salesShare = s.nextSales ? Math.min(100, (Number(s.sales) / Number(s.nextSales)) * 100) : 100;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-box bg-primary-50 p-3.5">
          <p className="text-[12px] text-primary-dark">Niveau</p>
          <p className="text-[22px] font-bold text-primary">{s.levelLabel}</p>
        </div>
        <div className="rounded-box bg-page/70 p-3.5">
          <p className="text-[12px] text-ink-3">Ventes validées (3 mois)</p>
          <p className="text-[22px] font-bold">{formatPrice(Number(s.sales))}</p>
        </div>
        <div className="rounded-box bg-page/70 p-3.5">
          <p className="text-[12px] text-ink-3">Note des clients</p>
          <p className="text-[22px] font-bold">{s.rating ? `${s.rating} / 5` : "—"}</p>
        </div>
      </div>
      <p className="text-[13px] text-ink-2"><b>Avantages :</b> {s.advantages}.</p>
      {s.nextLevel && s.nextSales && (
        <div>
          <p className="mb-1.5 text-[13px] text-ink-2">
            Pour passer <b>{LEVEL[s.nextLevel] ?? s.nextLevel}</b> : {formatPrice(Number(s.nextSales))} de ventes validées sur 3 mois et une note d&apos;au moins {s.nextRating}.
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-line-3" role="progressbar" aria-valuenow={Math.round(salesShare)} aria-valuemin={0} aria-valuemax={100} aria-label="Progression des ventes">
            <div className="h-full bg-primary" style={{ width: `${salesShare}%` }} />
          </div>
        </div>
      )}
      <p className="text-[12px] text-ink-3">{s.reviewedAt ? `Dernière révision le ${formatDate(s.reviewedAt)}.` : "Pas encore révisé."} Les niveaux sont revus le 1er janvier, avril, juillet et octobre.</p>
      {s.suspendedUntil && (
        <p className="flex items-start gap-2 rounded-box bg-danger-100 p-3 text-[13px] text-danger">
          <InfoCircle size={18} className="mt-0.5 shrink-0" /> Suspendu jusqu&apos;au {formatDate(s.suspendedUntil)} : pas de nouvelles commandes.
        </p>
      )}
    </div>
  );
}

function SanctionItem({ s, mine, canDecide }: { s: Sanction; mine: boolean; canDecide: boolean }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: keys.all });
  const explain = useMutation({
    mutationFn: () => api.post<Sanction>(ENDPOINTS.standing.explain(s.id), { explanation: text }),
    onSuccess: () => {
      setText("");
      refresh();
      toast.success("Explication envoyée", "L'équipe en tiendra compte avant de décider.");
    },
    onError: (e) => toast.error("Envoi impossible", getErrorMessage(e)),
  });
  const decide = useMutation({
    mutationFn: (apply: boolean) => api.post<Sanction>(ENDPOINTS.standing.decide(s.id), { apply, note: text }),
    onSuccess: (_d, apply) => {
      setText("");
      refresh();
      toast.success(apply ? "Sanction appliquée" : "Sanction abandonnée");
    },
    onError: (e) => toast.error("Décision impossible", getErrorMessage(e)),
  });
  const status = STATUS[s.status];
  const open = s.status === "notified";
  return (
    <li className="space-y-2 p-3.5 text-[13px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>
          <b>{s.kindLabel}{s.days ? ` · ${s.days} jours` : ""}</b>
          {!mine && <span className="text-ink-3"> · {s.resellerName}</span>}
          {s.urgent && <span className="text-danger"> · urgent</span>}
        </span>
        <Pill tone={status.tone}>{status.label}</Pill>
      </div>
      <p className="text-ink-2">Motif : {s.reason}</p>
      <p className="text-[12px] text-ink-3">
        Ouverte le {formatDateTime(s.createdAt)}
        {open && s.explainUntil ? ` · explication possible jusqu'au ${formatDateTime(s.explainUntil)}` : ""}
        {s.endsAt ? ` · jusqu'au ${formatDate(s.endsAt)}` : ""}
      </p>
      {s.explanation && <p className="rounded-box bg-page/70 p-2.5">Explication : {s.explanation}</p>}
      {s.decisionNote && <p className="text-ink-2">Décision : {s.decisionNote}</p>}
      {mine && open && !s.explainedAt && waiting(s) && (
        <div className="space-y-2">
          <Textarea aria-label="Votre explication" placeholder="Expliquez-vous par écrit (48 heures)" value={text} onChange={(e) => setText(e.target.value)} />
          <Button size="sm" upper={false} disabled={!text.trim()} loading={explain.isPending} onClick={() => explain.mutate()}>Envoyer mon explication</Button>
        </div>
      )}
      {canDecide && open && (
        <div className="space-y-2">
          <Input aria-label="Note de décision" placeholder="Note de décision (facultatif)" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="danger" upper={false} disabled={waiting(s)} title={waiting(s) ? "Le revendeur peut encore s'expliquer" : undefined} loading={decide.isPending && decide.variables} onClick={() => decide.mutate(true)}>Appliquer</Button>
            <Button size="sm" variant="outline" upper={false} loading={decide.isPending && !decide.variables} onClick={() => decide.mutate(false)}>Abandonner</Button>
          </div>
          {waiting(s) && <p className="text-[12px] text-ink-3">Le revendeur peut s&apos;expliquer jusqu&apos;au {formatDateTime(s.explainUntil!)}.</p>}
        </div>
      )}
    </li>
  );
}

function Mine() {
  const { data, isLoading } = useQuery({ queryKey: keys.detail(null), queryFn: () => api.get<Standing>(ENDPOINTS.standing.detail) });
  if (isLoading || !data) return <Skeleton className="h-60 rounded-box!" />;
  return (
    <div className="space-y-3 sm:space-y-4">
      <Block><LevelCard s={data} /></Block>
      <Block pad="none" className="overflow-hidden">
        <h3 className="px-4 pt-4 text-[14px] font-semibold">Sanctions</h3>
        {data.sanctions.length === 0 ? (
          <p className="p-4 text-[13px] text-ink-3">Aucune sanction.</p>
        ) : (
          <ul className="divide-y divide-line-3">{data.sanctions.map((s) => <SanctionItem key={s.id} s={s} mine canDecide={false} />)}</ul>
        )}
      </Block>
    </div>
  );
}

function OpenSanction() {
  const qc = useQueryClient();
  const resellers = useQuery({ queryKey: ["standing", "resellers"], queryFn: () => api.get<{ id: number; name: string }[]>(ENDPOINTS.notifications.assignableResellers) });
  const [resellerId, setResellerId] = useState("");
  const [kind, setKind] = useState<Kind>("warning");
  const [days, setDays] = useState("7");
  const [reason, setReason] = useState("");
  const [urgent, setUrgent] = useState(false);
  const open = useMutation({
    mutationFn: () =>
      api.post<Sanction>(ENDPOINTS.standing.sanctions, { resellerId: Number(resellerId), kind, reason, urgent, days: kind === "suspension" ? Number(days) : null }, idempotent()),
    onSuccess: (s) => {
      setReason("");
      setUrgent(false);
      qc.invalidateQueries({ queryKey: keys.all });
      toast.success(s.status === "applied" ? "Sanction appliquée" : "Revendeur prévenu", s.status === "applied" ? s.kindLabel : "Il a 48 heures pour s'expliquer avant votre décision.");
    },
    onError: (e) => toast.error("Sanction impossible", getErrorMessage(e)),
  });
  return (
    <Block>
      <h3 className="mb-3 text-[14px] font-semibold">Ouvrir une sanction</h3>
      <div className="space-y-2.5">
        <Select aria-label="Revendeur" value={resellerId} onChange={(e) => setResellerId(e.target.value)} options={[{ value: "", label: "Choisir un revendeur" }, ...(resellers.data ?? []).map((r) => ({ value: r.id, label: r.name }))]} />
        <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
          <Select aria-label="Sanction" value={kind} onChange={(e) => setKind(e.target.value as Kind)} options={[{ value: "warning", label: "Avertissement écrit" }, { value: "suspension", label: "Suspension" }, { value: "exclusion", label: "Exclusion" }]} />
          {kind === "suspension" && <Input aria-label="Durée (jours)" type="number" min="7" max="30" title="De 7 à 30 jours" value={days} onChange={(e) => setDays(e.target.value)} />}
        </div>
        <Textarea aria-label="Motif" placeholder="Motif, communiqué par écrit au revendeur" value={reason} onChange={(e) => setReason(e.target.value)} />
        {kind !== "warning" && <Checkbox label="Urgent (argent détourné) : appliquer sans attendre son explication" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />}
        <Button upper={false} variant={kind === "warning" ? "primary" : "danger"} disabled={!resellerId || !reason.trim()} loading={open.isPending} onClick={() => open.mutate()}>
          {kind === "warning" || urgent ? "Appliquer" : "Prévenir le revendeur"}
        </Button>
      </div>
    </Block>
  );
}

function Team() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status | "">("notified");
  const { data, isLoading } = useQuery({
    queryKey: [...keys.sanctions, status],
    queryFn: () => api.get<Page<Sanction>>(ENDPOINTS.standing.sanctions, { params: { status: status || undefined, pageSize: 50 } }),
  });
  const review = useMutation({
    mutationFn: () => api.post<{ changed: number }>(ENDPOINTS.standing.review),
    onSuccess: ({ changed }) => {
      qc.invalidateQueries({ queryKey: keys.all });
      toast.success("Niveaux revus", changed ? `${changed} niveau(x) modifié(s), revendeurs prévenus.` : "Aucun niveau ne change.");
    },
    onError: (e) => toast.error("Révision impossible", getErrorMessage(e)),
  });
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Block pad="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
          <h3 className="text-[14px] font-semibold">Sanctions</h3>
          <Select aria-label="Filtrer" wrapperClassName="w-56" value={status} onChange={(e) => setStatus(e.target.value as Status | "")} options={[{ value: "notified", label: "En attente d'explication" }, { value: "applied", label: "Appliquées" }, { value: "dropped", label: "Abandonnées" }, { value: "", label: "Toutes" }]} />
        </div>
        {isLoading || !data ? (
          <Skeleton className="m-4 h-40 rounded-box!" />
        ) : data.results.length === 0 ? (
          <EmptyState icon={<Award size={40} />} title="Aucune sanction" description="Rien dans cette liste." />
        ) : (
          <ul className="divide-y divide-line-3">{data.results.map((s) => <SanctionItem key={s.id} s={s} mine={false} canDecide />)}</ul>
        )}
      </Block>
      <div className="space-y-3 sm:space-y-4">
        <Block>
          <h3 className="mb-1 text-[14px] font-semibold">Niveaux</h3>
          <p className="mb-3 text-[13px] text-ink-2">Revus automatiquement le premier jour de chaque trimestre, d&apos;après les ventes validées des 3 derniers mois et la note. Débutant → Confirmé : 1 000 $ et 4,0 ; Ambassadeur : 3 000 $ et 4,5.</p>
          <Button upper={false} variant="outline" loading={review.isPending} onClick={() => review.mutate()}>Revoir les niveaux maintenant</Button>
        </Block>
        <OpenSanction />
      </div>
    </div>
  );
}

function Content() {
  const isTeam = useCan("standing.manage");
  return (
    <>
      <PageHeader
        title={isTeam ? "Niveaux et sanctions" : "Mon niveau"}
        description={isTeam ? "Avertissement, suspension de 7 à 30 jours ou exclusion ; avant une suspension ou une exclusion, le revendeur peut s'expliquer sous 48 heures." : "Votre niveau, ses avantages et ce qu'il faut pour monter."}
      />
      {isTeam ? <Team /> : <Mine />}
    </>
  );
}

export function StandingView() {
  return (
    <PermissionGuard permission="standing.view.own">
      <Content />
    </PermissionGuard>
  );
}
