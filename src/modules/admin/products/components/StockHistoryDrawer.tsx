"use client";

import { ArrowDown, ArrowUp } from "iconsax-reactjs";
import { cn } from "@/shared/lib/cn";
import { formatDateTime } from "@/shared/lib/format";
import { Drawer } from "@/shared/ui/Overlay";
import { Skeleton } from "@/shared/ui/Skeleton";
import type { Product } from "@/modules/products/types";
import { useStockMovements } from "../hooks/useAdminProducts";

const REASON: Record<string, string> = {
  inventaire: "Inventaire",
  "réapprovisionnement": "Réapprovisionnement",
  vente: "Vente",
  retour: "Retour",
  correction: "Correction",
  perte: "Perte / casse",
};

/** Historique des mouvements de stock d'un produit (le plus récent en premier). */
export function StockHistoryDrawer({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { data, isLoading } = useStockMovements(product?.id, !!product);
  return (
    <Drawer open={!!product} onClose={onClose} side="right" title="Historique du stock" className="max-w-[460px]">
      <div className="p-5">
        <p className="line-clamp-2 text-[14px] font-bold">{product?.name}</p>
        <p className="mt-1 text-[13px] text-ink-3">Stock actuel : <strong className="text-ink">{product?.stock}</strong> · seuil d&apos;alerte : {product?.stockThreshold}</p>
        <ol className="mt-5 space-y-3">
          {isLoading && Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          {data?.map((m) => (
            <li key={m.id} className="flex items-start gap-3 rounded-box border border-line-3 p-3">
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", m.delta > 0 ? "bg-primary-100 text-primary-dark" : m.delta < 0 ? "bg-danger-100 text-danger" : "bg-chip text-ink-2")}>
                {m.delta > 0 ? <ArrowUp size={16} variant="Bold" /> : m.delta < 0 ? <ArrowDown size={16} variant="Bold" /> : "="}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center justify-between gap-2 text-[14px] font-bold">
                  <span>{REASON[m.reason] ?? m.reason}</span>
                  <span className={cn("tabular-nums", m.delta > 0 ? "text-primary-dark" : m.delta < 0 ? "text-danger" : "text-ink-3")}>{m.delta > 0 ? "+" : ""}{m.delta}</span>
                </p>
                {m.note && <p className="mt-0.5 text-[12px] text-ink-2">{m.note}</p>}
                <p className="mt-1 text-[11px] text-ink-3">{formatDateTime(m.at)} · {m.by.name} · solde {m.balanceAfter}</p>
              </div>
            </li>
          ))}
          {data?.length === 0 && <li className="py-10 text-center text-[14px] text-ink-3">Aucun mouvement enregistré.</li>}
        </ol>
      </div>
    </Drawer>
  );
}
