"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Edit2, Refresh2, Trash } from "iconsax-reactjs";
import { ROUTES } from "@/config/routes";
import { cn } from "@/shared/lib/cn";
import { formatDateTime, formatPrice } from "@/shared/lib/format";
import { StatusDot } from "@/shared/ui/Badges";
import { Button } from "@/shared/ui/Button";
import { Drawer } from "@/shared/ui/Overlay";
import { SALE_STATUS_LABEL, type Sale } from "../types";
import { MethodBadge } from "./MethodBadge";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line-3/70 py-2.5 text-[14px]">
      <dt className="text-ink-2">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  );
}

interface Props {
  sale: Sale | null;
  onClose: () => void;
  canEdit: boolean;
  canRefund: boolean;
  canDelete: boolean;
  onRefund: (s: Sale) => void;
  onDelete: (s: Sale) => void;
}

/** Détail d'une vente (y compris les informations de remboursement / retour). */
export function SaleDetailDrawer({ sale, onClose, canEdit, canRefund, canDelete, onRefund, onDelete }: Props) {
  return (
    <Drawer open={!!sale} onClose={onClose} title={sale ? `Vente #${sale.id}` : ""} side="right">
      {sale && (
        <div className="space-y-5 p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <span className="relative size-20 shrink-0 overflow-hidden rounded-box bg-page">{sale.productImage && <Image src={sale.productImage} alt="" fill sizes="80px" className="object-cover" />}</span>
            <div className="min-w-0">
              <p className="text-[16px] font-bold leading-[22px]">{sale.productName}</p>
              <p className="text-[13px] text-ink-3">{sale.category}</p>
              <div className="mt-2"><StatusDot tone={sale.status === "valide" ? "green" : sale.status === "remboursée" ? "orange" : "gray"}>{SALE_STATUS_LABEL[sale.status]}</StatusDot></div>
            </div>
          </div>

          <dl>
            <Row label="Date de la vente">{formatDateTime(sale.dateAchat)}</Row>
            <Row label="Enregistrée le">{formatDateTime(sale.dateEnregistrement)}</Row>
            <Row label="Vendeur">{sale.seller?.name ?? "—"}</Row>
            <Row label="Vendu à">{sale.venduA ?? sale.buyer?.name ?? "—"}</Row>
            <Row label="Paiement"><MethodBadge method={sale.method} /></Row>
            <Row label="Prix unitaire">{formatPrice(sale.unitPrice)}</Row>
            <Row label="Quantité">× {sale.quantity}</Row>
            <Row label="Total"><span className={cn(sale.status !== "valide" && "line-through opacity-60")}>{formatPrice(sale.total)}</span></Row>
            <Row label="Bénéfice"><span className={cn(sale.profit < 0 ? "text-danger" : "text-primary-dark", sale.status !== "valide" && "line-through opacity-60")}>{formatPrice(sale.profit)}</span></Row>
            {sale.orderId && <Row label="Commande"><Link href={ROUTES.admin.order(sale.orderId)} className="text-primary hover:underline">#{sale.orderId}</Link></Row>}
          </dl>

          {sale.refund && (
            <div className="rounded-box border border-star/40 bg-star/10 p-4 text-[13px]">
              <p className="font-bold text-[#8a5a00]">{sale.status === "retournée" ? "Retour produit" : "Remboursement"} — {formatPrice(sale.refund.amount)}</p>
              <p className="mt-1 text-ink-2">« {sale.refund.reason} »</p>
              <p className="mt-1 text-[12px] text-ink-3">{formatDateTime(sale.refund.at)} · par {sale.refund.by}</p>
            </div>
          )}

          <div className="grid gap-2 pt-1 sm:flex sm:flex-wrap">
            {canEdit && <Button href={ROUTES.admin.saleEdit(sale.id)} variant="chip" upper={false} leftIcon={<Edit2 size={16} />}>Modifier</Button>}
            {canRefund && <Button variant="chip" upper={false} leftIcon={<Refresh2 size={16} />} onClick={() => onRefund(sale)}>Rembourser / retour</Button>}
            {canDelete && <Button variant="danger" upper={false} leftIcon={<Trash size={16} />} onClick={() => onDelete(sale)}>Supprimer</Button>}
          </div>
        </div>
      )}
    </Drawer>
  );
}
