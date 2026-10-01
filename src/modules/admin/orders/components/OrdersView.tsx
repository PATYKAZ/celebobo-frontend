"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Box1, Messages2, SearchNormal1, TickCircle, UserAdd } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatPrice } from "@/shared/lib/format";
import { getErrorMessage } from "@/shared/lib/api";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { StatusDot } from "@/shared/ui/Badges";
import { Select } from "@/shared/ui/Form";
import { Modal, Drawer } from "@/shared/ui/Overlay";
import { Tabs } from "@/shared/ui/Tabs";
import { toast } from "@/shared/ui/Toast";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ORDER_STATUS_LABEL, type Order, type OrderStatus } from "@/modules/orders/types";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import { DataTable, type Column } from "../../ui/DataTable";
import { PageHeader } from "../../ui/PageHeader";
import { useAdminOrders, useAssignOrder, useConcludeOrder, useResellerOptions } from "../hooks/useAdminOrders";

type Tab = OrderStatus | "all";
const TONE = { attente: "orange", traitement: "blue", terminé: "green" } as const;

function Thumbs({ order }: { order: Order }) {
  const extra = order.items.length - 3;
  return (
    <div className="flex items-center">
      {order.items.slice(0, 3).map((it, i) => (
        <span key={it.id} className="relative -ml-2 size-9 overflow-hidden rounded-full bg-page ring-2 ring-white first:ml-0" style={{ zIndex: 3 - i }}>
          {it.productImage && <Image src={it.productImage} alt={it.productName} fill sizes="36px" className="object-cover" />}
        </span>
      ))}
      {extra > 0 && <span className="-ml-2 grid size-9 place-items-center rounded-full bg-chip text-[11px] font-bold ring-2 ring-white">+{extra}</span>}
    </div>
  );
}

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "attente", label: "Commande reçue" },
  { key: "traitement", label: "Prise en charge par un revendeur" },
  { key: "terminé", label: "Discussion conclue" },
];

function Timeline({ status }: { status: OrderStatus }) {
  const idx = STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="space-y-4">
      {STEPS.map((s, i) => (
        <li key={s.key} className="flex items-center gap-3">
          <span className={cn("grid size-7 place-items-center rounded-full text-[12px] font-bold transition-colors", i <= idx ? "bg-primary text-white" : "bg-chip text-ink-3")}>
            {i <= idx ? <TickCircle size={16} variant="Bold" /> : i + 1}
          </span>
          <span className={cn("text-[14px]", i <= idx ? "font-semibold" : "text-ink-3")}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

export function OrdersView() {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounce(search, 300);
  const { data, isLoading } = useAdminOrders({ status: tab, search: q, page, pageSize: 8 });
  const { data: resellers } = useResellerOptions();
  const assign = useAssignOrder();
  const conclude = useConcludeOrder();

  const [assigning, setAssigning] = useState<Order | null>(null);
  const [resellerId, setResellerId] = useState("");
  const [concluding, setConcluding] = useState<Order | null>(null);
  const [detail, setDetail] = useState<Order | null>(null);

  const counts = data?.counts;
  const pageCount = Math.max(1, Math.ceil((data?.count ?? 0) / 8));

  const columns: Column<Order>[] = [
    { key: "id", header: "N°", cell: (o) => <span className="font-bold">#{o.id}</span> },
    {
      key: "client",
      header: "Client",
      cell: (o) => (
        <div className="min-w-0">
          <p className="truncate font-semibold">{o.user.name}</p>
          {o.user.email && <p className="truncate text-[12px] text-ink-3">{o.user.email}</p>}
        </div>
      ),
    },
    { key: "items", header: "Articles", hideBelow: "md", cell: (o) => <Thumbs order={o} /> },
    { key: "total", header: "Total", align: "right", cell: (o) => <span className="font-bold">{formatPrice(o.totalPrice)}</span> },
    { key: "status", header: "Statut", cell: (o) => <StatusDot tone={TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</StatusDot> },
    {
      key: "reseller",
      header: "Revendeur",
      hideBelow: "lg",
      cell: (o) => (o.assignedRevendeur ? <span className="font-medium">{o.assignedRevendeur.name}</span> : <span className="text-ink-3">Non assignée</span>),
    },
    { key: "date", header: "Date", hideBelow: "xl", cell: (o) => <span className="text-ink-2">{formatDate(o.createdAt)}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (o) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            title="Assigner à un revendeur"
            aria-label="Assigner à un revendeur"
            disabled={o.status === "terminé"}
            onClick={() => {
              setAssigning(o);
              setResellerId(o.assignedRevendeur ? String(o.assignedRevendeur.id) : "");
            }}
            className="grid size-9 place-items-center rounded-full bg-chip transition-colors hover:bg-primary hover:text-white disabled:opacity-40 disabled:hover:bg-chip disabled:hover:text-ink"
          >
            <UserAdd size={17} />
          </button>
          {o.conversationId != null && (
            <Link href={ROUTES.conversation(o.conversationId)} title="Ouvrir la discussion" aria-label="Ouvrir la discussion" className="grid size-9 place-items-center rounded-full bg-chip transition-colors hover:bg-primary hover:text-white">
              <Messages2 size={17} />
            </Link>
          )}
          <button
            title="Conclure la discussion"
            aria-label="Conclure la discussion"
            disabled={o.status === "terminé"}
            onClick={() => setConcluding(o)}
            className="grid size-9 place-items-center rounded-full bg-chip transition-colors hover:bg-primary hover:text-white disabled:opacity-40 disabled:hover:bg-chip disabled:hover:text-ink"
          >
            <TickCircle size={17} />
          </button>
        </div>
      ),
    },
  ];

  const confirmAssign = () => {
    if (!assigning || !resellerId) return;
    assign.mutate(
      { orderId: assigning.id, revendeurId: Number(resellerId) },
      {
        onSuccess: () => {
          toast.success("Commande assignée", `Commande #${assigning.id} transmise au revendeur.`);
          setAssigning(null);
        },
        onError: (e) => toast.error("Assignation impossible", getErrorMessage(e)),
      },
    );
  };

  const confirmConclude = () => {
    if (!concluding) return;
    conclude.mutate(concluding, {
      onSuccess: () => {
        toast.success("Discussion conclue", `Commande #${concluding.id} terminée.`);
        setConcluding(null);
      },
      onError: (e) => toast.error("Action impossible", getErrorMessage(e)),
    });
  };

  return (
    <>
      <PageHeader title="Commandes & discussions" description="Assignez les nouvelles commandes aux revendeurs et clôturez les discussions terminées.">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Tabs
            variant="pill"
            value={tab}
            onChange={(v) => {
              setTab(v);
              setPage(1);
            }}
            tabs={[
              { value: "all", label: "Toutes", count: counts?.all },
              { value: "attente", label: "En attente", count: counts?.attente },
              { value: "traitement", label: "En traitement", count: counts?.traitement },
              { value: "terminé", label: "Terminées", count: counts?.terminé },
            ]}
          />
          <div className="relative w-full sm:w-[280px]">
            <SearchNormal1 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Client ou n° de commande…"
              aria-label="Rechercher une commande"
              className="field pl-9"
            />
          </div>
        </div>
      </PageHeader>

      <Block pad="none" className="overflow-hidden">
        <DataTable
          columns={columns}
          rows={data?.results}
          rowKey={(o) => o.id}
          loading={isLoading}
          onRowClick={setDetail}
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
          empty={<EmptyState icon={<Box1 size={38} variant="Bulk" />} title="Aucune commande" description="Aucune commande ne correspond à ce filtre." />}
        />
      </Block>

      {/* Assigner */}
      <Modal open={!!assigning} onClose={() => setAssigning(null)} title={`Assigner la commande #${assigning?.id ?? ""}`}>
        <p className="mb-4 text-[14px] leading-[22px] text-ink-2">Le revendeur choisi sera notifié et rejoindra la discussion avec le client.</p>
        <Select
          label="Revendeur"
          value={resellerId}
          onChange={(e) => setResellerId(e.target.value)}
          options={[{ value: "", label: "Choisir un revendeur…" }, ...(resellers ?? []).map((r) => ({ value: r.id, label: r.name }))]}
        />
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="chip" upper={false} onClick={() => setAssigning(null)}>Annuler</Button>
          <Button upper={false} loading={assign.isPending} disabled={!resellerId} onClick={confirmAssign}>Assigner</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!concluding}
        onClose={() => setConcluding(null)}
        onConfirm={confirmConclude}
        loading={conclude.isPending}
        tone="primary"
        title="Conclure la discussion ?"
        message={`La commande #${concluding?.id ?? ""} sera marquée comme terminée et la discussion clôturée.`}
        confirmLabel="Conclure"
      />

      {/* Détail */}
      <Drawer open={!!detail} onClose={() => setDetail(null)} title={`Commande #${detail?.id ?? ""}`} side="right" className="max-w-[440px]">
        {detail && (
          <div className="space-y-6 p-5">
            <div className="flex items-center justify-between">
              <StatusDot tone={TONE[detail.status]}>{ORDER_STATUS_LABEL[detail.status]}</StatusDot>
              <span className="text-[13px] text-ink-3">{formatDate(detail.createdAt)}</span>
            </div>
            <div>
              <p className="text-[12px] uppercase tracking-wide text-ink-3">Client</p>
              <p className="font-bold">{detail.user.name}</p>
              {detail.user.email && <p className="text-[13px] text-ink-2">{detail.user.email}</p>}
              <p className="mt-2 text-[13px] text-ink-2">Revendeur : <strong className="text-ink">{detail.assignedRevendeur?.name ?? "non assigné"}</strong></p>
            </div>
            <div>
              <p className="mb-3 text-[12px] uppercase tracking-wide text-ink-3">Progression</p>
              <Timeline status={detail.status} />
            </div>
            <div>
              <p className="mb-3 text-[12px] uppercase tracking-wide text-ink-3">Articles</p>
              <ul className="space-y-3">
                {detail.items.map((it) => (
                  <li key={it.id} className="flex items-center gap-3">
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-page">
                      {it.productImage && <Image src={it.productImage} alt="" fill sizes="48px" className="object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-[13px] font-bold leading-[18px]">{it.productName}</span>
                      <span className="text-[12px] text-ink-3">{it.quantity} × {formatPrice(it.unitPrice)}</span>
                    </span>
                    <span className="text-[14px] font-semibold">{formatPrice(it.unitPrice * it.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-line-3 pt-4">
                <span className="font-semibold">Total</span>
                <span className="text-[20px] font-bold text-primary">{formatPrice(detail.totalPrice)}</span>
              </div>
            </div>
            {detail.conversationId != null && (
              <Button href={ROUTES.conversation(detail.conversationId)} fullWidth leftIcon={<Messages2 size={17} />}>Ouvrir la discussion</Button>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}
