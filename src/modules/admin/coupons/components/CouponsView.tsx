"use client";

import { useState } from "react";
import { Add, Edit2, SearchNormal1, TicketDiscount } from "@/shared/ui/icons";
import { getErrorMessage } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { formatPrice } from "@/shared/lib/format";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Input, Switch } from "@/shared/ui/Form";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { PageHeader } from "../../ui/PageHeader";
import { useAdminCoupons, useToggleCoupon } from "../hooks/useAdminCoupons";
import { couponStatus } from "../services/admin-coupons.service";
import type { AdminCoupon, CouponFilter, CouponStatus } from "../types";
import { CouponFormModal } from "./CouponFormModal";

const iconBtn = "grid size-11 place-items-center rounded-full bg-chip text-ink-2 transition-colors hover:bg-primary hover:text-white sm:size-9";

const STATUS: Record<CouponStatus, { label: string; className: string }> = {
  active: { label: "Actif", className: "bg-primary text-white" },
  scheduled: { label: "Programmé", className: "bg-sun text-on-light" },
  expired: { label: "Expiré", className: "bg-line-3 text-ink" },
  exhausted: { label: "Épuisé", className: "bg-line-3 text-ink" },
  inactive: { label: "Désactivé", className: "bg-line-3 text-ink" },
};

const FILTERS: { value: CouponFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "active", label: "Actifs" },
  { value: "inactive", label: "Désactivés" },
];

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

const discountLabel = (c: AdminCoupon) =>
  c.kind === "percent" ? `−${c.value} %${c.maxDiscount != null ? ` (max ${formatPrice(c.maxDiscount)})` : ""}` : `−${formatPrice(c.value)}`;

function period(c: AdminCoupon): string | null {
  if (c.startsAt && c.endsAt) return `Du ${dateFmt.format(new Date(c.startsAt))} au ${dateFmt.format(new Date(c.endsAt))}`;
  if (c.startsAt) return `À partir du ${dateFmt.format(new Date(c.startsAt))}`;
  if (c.endsAt) return `Jusqu'au ${dateFmt.format(new Date(c.endsAt))}`;
  return null;
}

/** Codes promo : remise en % ou en $, conditions, période, limites d'utilisation et activation. */
export function CouponsView() {
  return (
    <PermissionGuard permission="coupons.manage">
      <Content />
    </PermissionGuard>
  );
}

function CouponRow({ coupon, onEdit }: { coupon: AdminCoupon; onEdit: () => void }) {
  const toggle = useToggleCoupon();
  const status = STATUS[couponStatus(coupon)];
  const conditions = [
    coupon.minSubtotal > 0 ? `dès ${formatPrice(coupon.minSubtotal)}` : null,
    coupon.freeShipping ? "livraison offerte" : null,
    coupon.perUserLimit != null ? `${coupon.perUserLimit} fois par client` : null,
  ].filter(Boolean);
  const when = period(coupon);

  return (
    <li className={cn("flex flex-col gap-3 rounded-box border border-line-3 p-3 sm:flex-row sm:items-center sm:p-4", !coupon.isActive && "bg-chip/50")}>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[15px] font-bold tracking-wide">{coupon.code}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", status.className)}>{status.label}</span>
          <span className="text-[14px] font-bold text-primary">{discountLabel(coupon)}</span>
        </p>
        {coupon.description && <p className="mt-1 text-[13px] text-ink-2">{coupon.description}</p>}
        {(conditions.length > 0 || when) && (
          <p className="mt-1 text-[12px] text-ink-3">{[...conditions, when].filter(Boolean).join(" · ")}</p>
        )}
        <p className="mt-1.5 text-[12px] tabular-nums text-ink-2">
          <strong className="text-ink">{coupon.uses}</strong>
          {coupon.usageLimit != null ? ` / ${coupon.usageLimit}` : ""} utilisation{coupon.uses > 1 ? "s" : ""} · {formatPrice(coupon.discountTotal)} de remises accordées
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 max-sm:justify-end">
        <Switch
          label={coupon.isActive ? `Désactiver ${coupon.code}` : `Activer ${coupon.code}`}
          checked={coupon.isActive}
          onChange={(isActive) =>
            toggle.mutate(
              { id: coupon.id, isActive },
              { onSuccess: () => toast.success(isActive ? "Code activé" : "Code désactivé", coupon.code), onError: (e) => toast.error("Modification impossible", getErrorMessage(e)) },
            )
          }
        />
        <span className="mx-1 h-6 w-px bg-line-3" aria-hidden />
        <button type="button" aria-label={`Modifier ${coupon.code}`} onClick={onEdit} className={iconBtn}><Edit2 size={16} /></button>
      </div>
    </li>
  );
}

function Content() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CouponFilter>("all");
  const { data, isLoading, isError, error, refetch } = useAdminCoupons(search, filter);
  const [editing, setEditing] = useState<AdminCoupon | "new" | null>(null);
  const list = data ?? [];

  return (
    <>
      <PageHeader
        title="Codes promo"
        description="Une remise en pourcentage ou en montant, avec ses conditions. Le client saisit le code dans son panier ; la remise est comptée à la commande."
        actions={<Button upper={false} leftIcon={<Add size={18} />} onClick={() => setEditing("new")}>Nouveau code</Button>}
      />

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input aria-label="Rechercher un code" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un code…" leftIcon={<SearchNormal1 size={17} />} wrapperClassName="sm:max-w-[320px] sm:flex-1" />
        <div className="no-scrollbar overflow-x-auto">
          <SegmentedControl aria-label="Filtrer les codes" value={filter} onChange={setFilter} options={FILTERS} size="sm" />
        </div>
      </div>

      {isLoading ? (
        <div role="status" aria-busy="true" className="grid gap-3">
          <span className="sr-only">Chargement des codes promo…</span>
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[96px] rounded-box!" />)}
        </div>
      ) : isError ? (
        <Block className="text-center">
          <p className="text-[14px] text-ink-2">{getErrorMessage(error, "Impossible de charger les codes promo.")}</p>
          <Button className="mt-4" variant="chip" upper={false} onClick={() => refetch()}>Réessayer</Button>
        </Block>
      ) : list.length === 0 ? (
        <Block>
          <EmptyState
            icon={<TicketDiscount size={44} variant="Bulk" />}
            title={search || filter !== "all" ? "Aucun code dans cette liste" : "Aucun code promo"}
            description="Créez un code pour une campagne, un partenaire ou les nouveaux clients."
            action={<Button upper={false} leftIcon={<Add size={16} />} onClick={() => setEditing("new")}>Créer un code</Button>}
          />
        </Block>
      ) : (
        <Block pad="none" className="p-3 sm:p-5">
          <ol className="grid gap-2.5">
            {list.map((c) => (
              <CouponRow key={c.id} coupon={c} onEdit={() => setEditing(c)} />
            ))}
          </ol>
        </Block>
      )}

      {editing && <CouponFormModal key={editing === "new" ? "new" : editing.id} coupon={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}
