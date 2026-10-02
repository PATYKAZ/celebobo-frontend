"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowDown2, ArrowRight, Filter, SearchNormal1 } from "iconsax-reactjs";
import { Fragment, useState } from "react";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { cn } from "@/shared/lib/cn";
import { formatDateTime, formatRelative } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { Button } from "@/shared/ui/Button";
import { Input, Select } from "@/shared/ui/Form";
import { Pagination } from "@/shared/ui/Pagination";
import { Skeleton } from "@/shared/ui/Skeleton";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { ROLE_LABEL } from "@/modules/auth/permissions";
import { PageHeader } from "../../ui/PageHeader";
import { useAuditLog } from "../hooks/useAudit";
import { AUDIT_ENTITIES, type AuditEntity, type AuditEntry } from "../types";

const PAGE_SIZE = 12;
const ENTITY_STYLE: Record<AuditEntity, string> = {
  produit: "bg-info/10 text-info",
  vente: "bg-primary-100 text-primary-dark",
  commande: "bg-star/15 text-[#b87400]",
  catégorie: "bg-chip text-ink-2",
  utilisateur: "bg-danger-100 text-danger",
  revendeur: "bg-primary-100 text-primary-dark",
  commission: "bg-sun/30 text-ink",
  stock: "bg-ink-dark/10 text-ink-dark",
};

export function AuditView() {
  return (
    <PermissionGuard permission="audit.view">
      <AuditContent />
    </PermissionGuard>
  );
}

function Row({ e, open, onToggle }: { e: AuditEntry; open: boolean; onToggle: () => void }) {
  const hasDiff = !!e.diff?.length;
  return (
    <Fragment>
      <tr onClick={hasDiff ? onToggle : undefined} className={cn("border-b border-line-3/70 transition-colors", hasDiff ? "cursor-pointer hover:bg-primary-50" : "hover:bg-page/40")}>
        <td className="whitespace-nowrap px-4 py-3.5 align-top text-[13px]"><span className="block font-semibold">{formatDateTime(e.at)}</span><span className="text-[12px] text-ink-3">{formatRelative(e.at)}</span></td>
        <td className="px-4 py-3.5 align-top text-[13px]"><span className="block font-semibold">{e.actor.name}</span><span className="text-[12px] text-ink-3">{ROLE_LABEL[e.actor.role]}</span></td>
        <td className="px-4 py-3.5 align-top">
          <span className="block text-[14px] font-semibold">{e.action}</span>
          <span className="block text-[13px] leading-[19px] text-ink-2">{e.summary}</span>
        </td>
        <td className="hidden px-4 py-3.5 align-top md:table-cell"><span className={cn("rounded-full px-2.5 py-1 text-[12px] font-semibold capitalize", ENTITY_STYLE[e.entity])}>{e.entity}{e.entityId != null ? ` #${e.entityId}` : ""}</span></td>
        <td className="w-10 px-3 py-3.5 align-top text-ink-3">{hasDiff && <ArrowDown2 size={16} className={cn("transition-transform", open && "rotate-180")} />}</td>
      </tr>
      <AnimatePresence initial={false}>
        {open && hasDiff && (
          <tr className="border-b border-line-3/70 bg-page/40">
            <td colSpan={5} className="p-0">
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                <div className="grid gap-2 px-4 py-3.5">
                  {e.diff!.map((d) => (
                    <div key={d.field} className="flex flex-wrap items-center gap-2 text-[13px]">
                      <code className="rounded bg-white px-2 py-0.5 font-semibold">{d.field}</code>
                      <span className="rounded bg-danger-100 px-2 py-0.5 text-danger line-through">{String(d.from ?? "—")}</span>
                      <ArrowRight size={14} className="text-ink-3" />
                      <span className="rounded bg-primary-100 px-2 py-0.5 font-semibold text-primary-dark">{String(d.to ?? "—")}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </Fragment>
  );
}

function DiffList({ e }: { e: AuditEntry }) {
  return (
    <div className="grid gap-2">
      {e.diff!.map((d) => (
        <div key={d.field} className="flex flex-wrap items-center gap-2 text-[13px]">
          <code className="rounded bg-white px-2 py-0.5 font-semibold">{d.field}</code>
          <span className="rounded bg-danger-100 px-2 py-0.5 text-danger line-through">{String(d.from ?? "—")}</span>
          <ArrowRight size={14} className="text-ink-3" />
          <span className="rounded bg-primary-100 px-2 py-0.5 font-semibold text-primary-dark">{String(d.to ?? "—")}</span>
        </div>
      ))}
    </div>
  );
}

/** Carte mobile d'une entrée d'audit : action, résumé, auteur, élément ; le diff se déplie au toucher. */
function AuditCard({ e, open, onToggle }: { e: AuditEntry; open: boolean; onToggle: () => void }) {
  const hasDiff = !!e.diff?.length;
  return (
    <article className="rounded-box border border-line-3 bg-white">
      <button onClick={hasDiff ? onToggle : undefined} disabled={!hasDiff} aria-expanded={hasDiff ? open : undefined} className="block w-full p-4 text-left disabled:cursor-default">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[15px] font-bold leading-[20px]">{e.action}</p>
            <p className="mt-0.5 text-[13px] leading-[19px] text-ink-2">{e.summary}</p>
          </div>
          {hasDiff && <ArrowDown2 size={18} className={cn("mt-0.5 shrink-0 text-ink-3 transition-transform", open && "rotate-180")} />}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-ink-3">
          <span className={cn("rounded-full px-2.5 py-1 font-semibold capitalize", ENTITY_STYLE[e.entity])}>{e.entity}{e.entityId != null ? ` #${e.entityId}` : ""}</span>
          <span><strong className="text-ink">{e.actor.name}</strong> · {ROLE_LABEL[e.actor.role]}</span>
          <span>{formatDateTime(e.at)} · {formatRelative(e.at)}</span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && hasDiff && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden rounded-b-box bg-page/50">
            <div className="p-4"><DiffList e={e} /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

function AuditContent() {
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState<AuditEntity | "all">("all");
  const [actorId, setActorId] = useState<number | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const [sheet, setSheet] = useState(false);
  const debounced = useDebounce(search, 300);
  const { data, isLoading } = useAuditLog({ search: debounced, entity, actorId, from: from || undefined, to: to || undefined, page, pageSize: PAGE_SIZE });
  const reset = () => { setSearch(""); setEntity("all"); setActorId("all"); setFrom(""); setTo(""); setPage(1); };
  const reg = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
  const activeFilters = [entity !== "all", actorId !== "all", !!from, !!to].filter(Boolean).length;
  /** Champs de filtre partagés par la grille desktop et la feuille mobile */
  const filterFields = (labels: boolean) => (
    <>
      <Select aria-label="Type d'élément" value={entity} onChange={(e) => reg(setEntity)(e.target.value as AuditEntity | "all")} options={[{ value: "all", label: "Tous les éléments" }, ...AUDIT_ENTITIES]} />
      <Select aria-label="Auteur" value={String(actorId)} onChange={(e) => reg(setActorId)(e.target.value === "all" ? "all" : Number(e.target.value))} options={[{ value: "all", label: "Tous les auteurs" }, ...(data?.actors ?? []).map((a) => ({ value: a.id, label: a.name }))]} />
      <Input type="date" label={labels ? "Du" : undefined} aria-label="Du" value={from} onChange={(e) => reg(setFrom)(e.target.value)} />
      <Input type="date" label={labels ? "Au" : undefined} aria-label="Au" value={to} onChange={(e) => reg(setTo)(e.target.value)} />
    </>
  );

  return (
    <>
      <PageHeader title="Journal d'audit" description="Historique des actions sensibles : suppressions, modifications de prix, changements de statut, rôles et paiements." />
      <Block pad="none">
        {/* mobile : recherche + bouton « Filtres » (feuille) */}
        <div className="flex items-center gap-2 p-3 md:hidden">
          <Input wrapperClassName="flex-1" placeholder="Rechercher…" aria-label="Rechercher" leftIcon={<SearchNormal1 size={16} />} value={search} onChange={(e) => reg(setSearch)(e.target.value)} />
          <button onClick={() => setSheet(true)} aria-label="Filtres" className="relative grid size-12 shrink-0 place-items-center rounded-md border border-line bg-white active:scale-95">
            <Filter size={20} />
            {activeFilters > 0 && <span className="absolute -right-1 -top-1 grid size-[18px] place-items-center rounded-full bg-primary text-[10px] font-bold text-white">{activeFilters}</span>}
          </button>
        </div>
        <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Filtres">
          <div className="grid gap-3 pb-2 pt-1">
            {filterFields(true)}
            <div className="mt-1 grid grid-cols-2 gap-2.5">
              <Button variant="chip" upper={false} onClick={reset}>Réinitialiser</Button>
              <Button upper={false} onClick={() => setSheet(false)}>Appliquer</Button>
            </div>
          </div>
        </BottomSheet>
        {/* desktop / tablette : grille de filtres */}
        <div className="hidden gap-4 p-5 sm:px-[30px] md:grid md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr_auto] xl:items-end">
          <Input placeholder="Rechercher une action, un auteur…" aria-label="Rechercher" leftIcon={<SearchNormal1 size={16} />} value={search} onChange={(e) => reg(setSearch)(e.target.value)} />
          {filterFields(false)}
          <Button variant="chip" upper={false} onClick={reset}>Réinitialiser</Button>
        </div>

        {/* mobile : cartes */}
        <div className="flex flex-col gap-2.5 p-3 pt-1 md:hidden">
          {isLoading
            ? Array.from({ length: 4 }, (_, i) => <div key={i} className="space-y-2.5 rounded-box border border-line-3 p-4"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/2" /></div>)
            : data?.results.map((e) => <AuditCard key={e.id} e={e} open={openId === e.id} onToggle={() => setOpenId(openId === e.id ? null : e.id)} />)}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-line-3 bg-page/50 text-left text-[12px] font-semibold uppercase tracking-wide text-ink-3">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Auteur</th>
                <th className="px-4 py-3">Action</th>
                <th className="hidden px-4 py-3 md:table-cell">Élément</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }, (_, i) => <tr key={i} className="border-b border-line-3/70"><td colSpan={5} className="px-4 py-4"><Skeleton className="h-5 w-full" /></td></tr>)
                : data?.results.map((e) => <Row key={e.id} e={e} open={openId === e.id} onToggle={() => setOpenId(openId === e.id ? null : e.id)} />)}
            </tbody>
          </table>
        </div>
        {data && data.results.length === 0 && <p className="py-14 text-center text-[14px] text-ink-3">Aucune entrée ne correspond à ces filtres.</p>}
        {data && <Pagination page={page} pageCount={Math.ceil(data.count / PAGE_SIZE)} onChange={setPage} className="py-5" />}
      </Block>
    </>
  );
}
