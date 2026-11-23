"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Gift, MoneyRecive } from "@/shared/ui/icons";
import { ENDPOINTS } from "@/config/endpoints";
import { Pill } from "@/shared/ui/Badges";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Input, Select, Textarea } from "@/shared/ui/Form";
import { Modal } from "@/shared/ui/Overlay";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { api, getErrorMessage, idempotent } from "@/shared/lib/api";
import { formatDate, formatDateTime, formatPrice } from "@/shared/lib/format";
import { PermissionGuard, useCan } from "@/modules/auth/hooks/useCan";
import { adminProductsService } from "@/modules/admin/products/services/admin-products.service";
import { campaignConditions, campaignHeadline, type Campaign, type CampaignKind, type Payout, type Reward } from "@/modules/cagnotte/types";
import { PageHeader } from "../ui/PageHeader";

interface Page<T> {
  results: T[];
  meta: { count: number };
}

const keys = { campaigns: ["cagnotte", "campaigns"] as const, rewards: (tab: string) => ["cagnotte", "rewards", tab] as const };
const STATE: Record<Campaign["state"], { label: string; tone: "green" | "yellow" | "gray" }> = {
  running: { label: "En cours", tone: "green" },
  upcoming: { label: "À venir", tone: "yellow" },
  ended: { label: "Terminée", tone: "gray" },
};

/** datetime-local ⇄ ISO (heure locale du navigateur). */
const toLocal = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const toIso = (local: string) => new Date(local).toISOString();

interface FormValues {
  name: string;
  description: string;
  kind: CampaignKind;
  percent: string;
  startsAt: string;
  endsAt: string;
  minPurchase: string;
  cap: string;
  payout: Payout;
  pointsValidDays: string;
  categoryIds: number[];
  products: { id: number; name: string }[];
}

function initial(c: Campaign | null): FormValues {
  const start = new Date(Date.now() + 24 * 3600_000);
  return c
    ? {
        name: c.name,
        description: c.description,
        kind: c.kind,
        percent: c.percent,
        startsAt: toLocal(c.startsAt),
        endsAt: toLocal(c.endsAt),
        minPurchase: c.minPurchase ?? "",
        cap: c.cap ?? "",
        payout: c.payout ?? "points",
        pointsValidDays: String(c.pointsValidDays ?? 90),
        categoryIds: c.categories.map((x) => x.id),
        products: c.products,
      }
    : {
        name: "",
        description: "",
        kind: "cashback",
        percent: "3",
        startsAt: toLocal(start.toISOString()),
        endsAt: toLocal(new Date(start.getTime() + 14 * 24 * 3600_000).toISOString()),
        minPurchase: "",
        cap: "",
        payout: "points",
        pointsValidDays: "90",
        categoryIds: [],
        products: [],
      };
}

function ProductPicker({ value, onChange }: { value: FormValues["products"]; onChange: (v: FormValues["products"]) => void }) {
  const [q, setQ] = useState("");
  const search = useQuery({
    queryKey: ["cagnotte", "product-search", q],
    queryFn: () => adminProductsService.list({ search: q, pageSize: 8 }),
    enabled: q.trim().length >= 2,
  });
  return (
    <div>
      <Input aria-label="Ajouter un produit" placeholder="Ajouter un produit (2 lettres au moins)" value={q} onChange={(e) => setQ(e.target.value)} />
      {q.trim().length >= 2 && (search.data?.results ?? []).length > 0 && (
        <ul className="mt-1 max-h-44 overflow-auto rounded-box border border-line-3 text-[13px]">
          {(search.data?.results ?? []).filter((p) => !value.some((v) => v.id === Number(p.id))).map((p) => (
            <li key={p.id}>
              <button type="button" className="w-full px-3 py-2 text-left hover:bg-page/60" onClick={() => { onChange([...value, { id: Number(p.id), name: p.name }]); setQ(""); }}>{p.name}</button>
            </li>
          ))}
        </ul>
      )}
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((p) => (
            <button key={p.id} type="button" onClick={() => onChange(value.filter((v) => v.id !== p.id))} className="rounded-full bg-chip px-2.5 py-1 text-[12px]" aria-label={`Retirer ${p.name}`}>{p.name} ×</button>
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignForm({ campaign, onClose }: { campaign: Campaign | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [v, setV] = useState<FormValues>(() => initial(campaign));
  const set = <K extends keyof FormValues>(k: K, value: FormValues[K]) => setV((s) => ({ ...s, [k]: value }));
  const categories = useQuery({ queryKey: ["cagnotte", "categories"], queryFn: () => api.get<{ id: number; name: string; parentId: number | null }[]>(ENDPOINTS.admin.categories.list) });
  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: v.name,
        description: v.description,
        kind: v.kind,
        percent: v.percent,
        startsAt: toIso(v.startsAt),
        endsAt: toIso(v.endsAt),
        minPurchase: v.minPurchase || null,
        cap: v.cap || null,
        payout: v.payout,
        pointsValidDays: Number(v.pointsValidDays) || 90,
        categoryIds: v.categoryIds,
        productIds: v.products.map((p) => p.id),
      };
      return campaign ? api.put<Campaign>(ENDPOINTS.cagnotte.campaign(campaign.id), body) : api.post<Campaign>(ENDPOINTS.cagnotte.campaigns, body, idempotent());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.campaigns });
      qc.invalidateQueries({ queryKey: ["cagnotte", "current"] });
      toast.success(campaign ? "Opération modifiée" : "Opération créée");
      onClose();
    },
    onError: (e) => toast.error("Enregistrement impossible", getErrorMessage(e)),
  });
  const inPoints = v.kind === "boosted_points" || (v.kind === "cashback" && v.payout === "points");
  return (
    <div className="space-y-3">
      <Input label="Nom" value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="Fête des mères" />
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <Select label="Forme" value={v.kind} onChange={(e) => set("kind", e.target.value as CampaignKind)} options={[{ value: "discount", label: "Remise immédiate" }, { value: "cashback", label: "Cashback" }, { value: "boosted_points", label: "Points majorés" }]} />
        <Input label="Pourcentage" type="number" min="0.01" max="50" step="0.01" value={v.percent} onChange={(e) => set("percent", e.target.value)} />
      </div>
      {v.kind === "cashback" && (
        <Select label="Versement du cashback" value={v.payout} onChange={(e) => set("payout", e.target.value as Payout)} options={[{ value: "points", label: "En points Cagnotte" }, { value: "mobile_money", label: "Par Mobile Money (M-Pesa, Airtel Money)" }]} />
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Début" type="datetime-local" value={v.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
        <Input label="Fin" type="datetime-local" value={v.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input label="Achat minimum ($)" type="number" min="0" step="0.01" value={v.minPurchase} onChange={(e) => set("minPurchase", e.target.value)} hint="Sur les produits concernés" />
        <Input label="Plafond par commande ($)" type="number" min="0.01" step="0.01" value={v.cap} onChange={(e) => set("cap", e.target.value)} hint="Vide : sans plafond" />
        {inPoints && <Input label="Validité des points (jours)" type="number" min="1" max="730" value={v.pointsValidDays} onChange={(e) => set("pointsValidDays", e.target.value)} />}
      </div>
      <fieldset>
        <legend className="mb-1.5 text-[13px] font-semibold">Produits concernés <span className="font-normal text-ink-3">(rien de coché : tous les produits)</span></legend>
        <div className="flex max-h-36 flex-wrap gap-1.5 overflow-auto">
          {(categories.data ?? []).map((c) => {
            const on = v.categoryIds.includes(c.id);
            return (
              <button key={c.id} type="button" aria-pressed={on} onClick={() => set("categoryIds", on ? v.categoryIds.filter((x) => x !== c.id) : [...v.categoryIds, c.id])} className={`rounded-full px-2.5 py-1 text-[12px] ${on ? "bg-primary text-white" : "bg-chip"}`}>
                {c.parentId ? "↳ " : ""}{c.name}
              </button>
            );
          })}
        </div>
        <div className="mt-2"><ProductPicker value={v.products} onChange={(p) => set("products", p)} /></div>
      </fieldset>
      <Textarea label="Conditions annoncées" value={v.description} onChange={(e) => set("description", e.target.value)} placeholder="Texte affiché sur le site avec l'opération" />
      <div className="flex justify-end gap-2">
        <Button variant="outline" upper={false} onClick={onClose}>Annuler</Button>
        <Button upper={false} disabled={!v.name.trim()} loading={save.isPending} onClick={() => save.mutate()}>Enregistrer</Button>
      </div>
    </div>
  );
}

function Campaigns() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Campaign | null | "new">(null);
  const { data, isLoading } = useQuery({ queryKey: keys.campaigns, queryFn: () => api.get<Campaign[]>(ENDPOINTS.cagnotte.campaigns) });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: keys.campaigns });
    qc.invalidateQueries({ queryKey: ["cagnotte", "current"] });
  };
  const end = useMutation({
    mutationFn: (id: number) => api.post<Campaign>(ENDPOINTS.cagnotte.end(id)),
    onSuccess: () => { refresh(); toast.success("Opération terminée"); },
    onError: (e) => toast.error("Impossible d'y mettre fin", getErrorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(ENDPOINTS.cagnotte.campaign(id)),
    onSuccess: () => { refresh(); toast.success("Opération supprimée"); },
    onError: (e) => toast.error("Suppression impossible", getErrorMessage(e)),
  });
  return (
    <Block pad="none" className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 sm:px-6">
        <h2 className="text-[15px] font-bold">Opérations</h2>
        <Button size="sm" upper={false} onClick={() => setEditing("new")}>Nouvelle opération</Button>
      </div>
      {isLoading || !data ? (
        <Skeleton className="m-4 h-40 rounded-box!" />
      ) : data.length === 0 ? (
        <EmptyState icon={<Gift size={40} />} title="Aucune opération" description="Une opération Cagnotte s'ajoute aux points de fidélité pour une période limitée." />
      ) : (
        <ul className="divide-y divide-line-3">
          {data.map((c) => (
            <li key={c.id} className="space-y-1.5 px-4 py-3.5 text-[13px] sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span><b className="text-[14px]">{c.name}</b> · {campaignHeadline(c)}</span>
                <Pill tone={STATE[c.state].tone}>{STATE[c.state].label}</Pill>
              </div>
              <p className="text-ink-3">Du {formatDateTime(c.startsAt)} au {formatDateTime(c.endsAt)}</p>
              <p className="text-ink-2">{campaignConditions(c).slice(0, -1).join(" · ")}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {c.state === "upcoming" && <Button size="sm" variant="outline" upper={false} onClick={() => setEditing(c)}>Modifier</Button>}
                {c.state === "upcoming" && <Button size="sm" variant="ghost" upper={false} loading={remove.isPending && remove.variables === c.id} onClick={() => remove.mutate(c.id)}>Supprimer</Button>}
                {c.state === "running" && <Button size="sm" variant="danger" upper={false} loading={end.isPending} onClick={() => end.mutate(c.id)}>Y mettre fin maintenant</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Nouvelle opération Cagnotte" : "Modifier l'opération"} className="max-w-[640px]">
        {editing !== null && <CampaignForm campaign={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      </Modal>
    </Block>
  );
}

function RewardRow({ r }: { r: Reward }) {
  const qc = useQueryClient();
  const [reference, setReference] = useState("");
  const pay = useMutation({
    mutationFn: () => api.post<Reward>(ENDPOINTS.cagnotte.pay(r.id), { reference }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cagnotte", "rewards"] }); toast.success("Cashback versé", "Le client est prévenu."); },
    onError: (e) => toast.error("Enregistrement impossible", getErrorMessage(e)),
  });
  return (
    <li className="space-y-2 px-4 py-3.5 text-[13px] sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span><b>{r.clientName}</b> · commande {r.orderNumber} · {r.campaignName}</span>
        <b className="text-[15px] text-primary">{formatPrice(Number(r.kept))}</b>
      </div>
      <p className="text-ink-3">
        {r.status === "paid" ? `Versé le ${formatDate(r.paidAt!)} · réf. ${r.reference}` : `Téléphone ${r.phone} · à verser depuis le ${formatDate(r.availableAt)}`}
        {Number(r.owedBack) > 0 && <span className="text-danger"> · {formatPrice(Number(r.owedBack))} à déduire du remboursement (retour)</span>}
      </p>
      {r.status === "to_pay" && (
        <div className="flex flex-wrap gap-2">
          <Input aria-label="Référence Mobile Money" placeholder="Référence Mobile Money" wrapperClassName="min-w-0 flex-1" value={reference} onChange={(e) => setReference(e.target.value)} />
          <Button upper={false} disabled={!reference.trim()} loading={pay.isPending} onClick={() => pay.mutate()}>Marquer versé</Button>
        </div>
      )}
    </li>
  );
}

function Rewards() {
  const [tab, setTab] = useState<"due" | "paid">("due");
  const { data, isLoading } = useQuery({
    queryKey: keys.rewards(tab),
    queryFn: () => api.get<Page<Reward>>(ENDPOINTS.cagnotte.rewards, { params: tab === "due" ? { due: true, pageSize: 50 } : { status: "paid", pageSize: 50 } }),
  });
  return (
    <Block pad="none" className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 sm:px-6">
        <h2 className="text-[15px] font-bold">Cashbacks par Mobile Money</h2>
        <SegmentedControl size="sm" aria-label="Cashbacks" value={tab} onChange={setTab} options={[{ value: "due", label: "À verser" }, { value: "paid", label: "Versés" }]} />
      </div>
      {isLoading || !data ? (
        <Skeleton className="m-4 h-32 rounded-box!" />
      ) : data.results.length === 0 ? (
        <EmptyState icon={<MoneyRecive size={40} />} title={tab === "due" ? "Rien à verser" : "Aucun versement"} description={tab === "due" ? "Un cashback est à verser une fois la commande livrée et le délai d'essai passé." : "Les cashbacks versés apparaissent ici."} />
      ) : (
        <ul className="divide-y divide-line-3">{data.results.map((r) => <RewardRow key={r.id} r={r} />)}</ul>
      )}
    </Block>
  );
}

function Content() {
  const canManage = useCan("cagnotte.manage");
  return (
    <>
      <PageHeader title="Cagnotte" description="Opérations limitées dans le temps (remise, cashback, points majorés), toujours en plus des points de fidélité. Une seule à la fois ; ses conditions sont figées dès qu'elle commence." />
      <div className="space-y-3 sm:space-y-4">
        {canManage && <Campaigns />}
        <Rewards />
      </div>
    </>
  );
}

export function CagnotteView() {
  return (
    <PermissionGuard permission="cagnotte.pay">
      <Content />
    </PermissionGuard>
  );
}
