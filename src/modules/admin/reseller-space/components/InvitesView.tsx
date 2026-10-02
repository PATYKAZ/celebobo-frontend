"use client";

import { InfoCircle, People, ShoppingBag } from "iconsax-reactjs";
import { useMemo, useState } from "react";
import { Reveal } from "@/shared/animations/Reveal";
import { formatDate, formatPrice } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { Block } from "@/shared/ui/Block";
import { EmptyState } from "@/shared/ui/EmptyState";
import { DataTable, type Column } from "@/modules/admin/ui/DataTable";
import { PageHeader } from "@/modules/admin/ui/PageHeader";
import { StatCard } from "@/modules/admin/ui/StatCard";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useMyInvites } from "../hooks/useResellerSpace";
import type { InvitedClientRow } from "../types";
import { InviteCard } from "./InviteCard";

const PAGE_SIZE = 10;

const TIPS = [
  "Partagez votre lien ou faites scanner le QR code : le code est pré-rempli à l'inscription.",
  "Un client invité reste rattaché à vous : vos commissions s'appliquent sur ses commandes que vous menez à terme.",
  "Passez en « En ligne » pour recevoir les nouvelles commandes plus vite.",
];

function Inner() {
  const { user } = useAuth();
  const { data, isLoading } = useMyInvites();
  const [page, setPage] = useState(1);

  const columns = useMemo<Column<InvitedClientRow>[]>(
    () => [
      {
        key: "name",
        header: "Client",
        cell: (c) => (
          <div className="flex items-center gap-3">
            <Avatar name={c.name} size={36} />
            <div className="min-w-0">
              <p className="truncate font-semibold leading-[18px]">{c.name}</p>
              <p className="truncate text-[12px] text-ink-3">{c.email}</p>
            </div>
          </div>
        ),
      },
      { key: "joined", header: "Inscrit le", hideBelow: "sm", cell: (c) => formatDate(c.joinedAt) },
      { key: "orders", header: "Commandes", align: "right", cell: (c) => c.ordersCount },
      { key: "total", header: "Montant commandé", align: "right", cell: (c) => <strong>{formatPrice(c.ordersTotal)}</strong> },
    ],
    [],
  );

  if (user && user.role !== "revendeur") {
    return (
      <Block>
        <EmptyState icon={<InfoCircle size={34} variant="Bulk" />} title="Réservé aux revendeurs" description="Les invitations sont rattachées au compte d'un revendeur. Les responsables retrouvent l'ensemble des revendeurs et de leurs invités dans « Revendeurs »." />
      </Block>
    );
  }

  const rows = data?.invited ?? [];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  return (
    <>
      <PageHeader title="Mes invités" description="Les clients inscrits avec votre code d'invitation." />

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_390px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Clients invités" value={data?.invitedCount ?? 0} icon={<People size={22} variant="Bold" />} />
            <StatCard label="Commandes générées (total)" value={data?.ordersTotal ?? 0} format={formatPrice} icon={<ShoppingBag size={22} variant="Bold" />} tone="blue" delay={0.05} />
          </div>
          <Reveal>
            <Block pad="none" className="overflow-hidden">
              <DataTable
                columns={columns}
                rows={rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
                rowKey={(r) => r.id}
                loading={isLoading}
                page={page}
                pageCount={pageCount}
                onPageChange={setPage}
                empty={<EmptyState icon={<People size={34} variant="Bulk" />} title="Aucun invité pour le moment" description="Partagez votre code ou votre lien pour inviter vos premiers clients." className="py-12" />}
              />
            </Block>
          </Reveal>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <InviteCard code={data?.code ?? ""} invitedCount={data?.invitedCount} />
          <Reveal>
            <Block pad="sm">
              <h2 className="mb-3 text-[16px] font-bold leading-[22px]">Bien inviter</h2>
              <ul className="space-y-3">
                {TIPS.map((t) => (
                  <li key={t} className="flex gap-3 text-[13px] leading-[19px] text-ink-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    {t}
                  </li>
                ))}
              </ul>
            </Block>
          </Reveal>
        </div>
      </div>
    </>
  );
}

/** `/admin/invites` — mes invités + lien / QR code (revendeur). */
export function InvitesView() {
  return (
    <PermissionGuard permission="commissions.view.own">
      <Inner />
    </PermissionGuard>
  );
}
