"use client";

import { RevealGroup, RevealItem } from "@/shared/animations/Reveal";
import { formatDate, formatPrice, pluralize } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { Drawer } from "@/shared/ui/Overlay";
import type { Reseller } from "../types";

/** Panneau latéral : détail d'un revendeur et de ses clients invités. */
export function ResellerDrawer({ reseller, onClose }: { reseller: Reseller | null; onClose: () => void }) {
  return (
    <Drawer open={!!reseller} onClose={onClose} title="Détail du revendeur" side="right" className="max-w-[440px]">
      {reseller && (
        <div className="p-5">
          <div className="flex items-center gap-4">
            <Avatar src={reseller.avatar} name={reseller.name} size={64} />
            <div className="min-w-0">
              <p className="truncate text-[18px] font-bold leading-[24px]">{reseller.name}</p>
              <p className="truncate text-[13px] text-ink-3">{reseller.email}</p>
              <p className="mt-1 text-[12px] text-ink-2">Code : <strong className="tracking-widest">{reseller.codeRevendeur}</strong></p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-box bg-chip p-3"><p className="text-[12px] text-ink-3">Clients invités</p><p className="text-[20px] font-bold">{reseller.invitedCount}</p></div>
            <div className="rounded-box bg-primary-50 p-3"><p className="text-[12px] text-ink-3">Ventes générées</p><p className="text-[20px] font-bold text-primary">{formatPrice(reseller.salesTotal)}</p></div>
          </div>
          <h4 className="mb-3 mt-6 text-[15px] font-bold">Clients invités ({reseller.invited.length})</h4>
          {reseller.invited.length === 0 ? (
            <p className="rounded-box bg-chip p-6 text-center text-[13px] text-ink-3">Aucun client invité pour le moment.</p>
          ) : (
            <RevealGroup stagger={0.04} className="flex flex-col gap-2">
              {reseller.invited.slice(0, 40).map((c) => (
                <RevealItem key={c.id} className="flex items-center gap-3 rounded-box border border-line-3 p-2.5">
                  <Avatar name={c.name} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold leading-[18px]">{c.name}</span>
                    <span className="text-[12px] text-ink-3">Inscrit le {formatDate(c.joinedAt)}</span>
                  </span>
                  <span className="text-[12px] font-semibold text-ink-2">{pluralize(c.ordersCount, "commande")}</span>
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </div>
      )}
    </Drawer>
  );
}
