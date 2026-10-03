"use client";

import Link from "next/link";
import { Copy, Wallet3 } from "iconsax-reactjs";
import { useEffect, useState } from "react";
import { ROUTES } from "@/config/routes";
import { RevealGroup, RevealItem } from "@/shared/animations/Reveal";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatPrice, pluralize } from "@/shared/lib/format";
import { getErrorMessage } from "@/shared/lib/api";
import { Avatar } from "@/shared/ui/Avatar";
import { StatusDot } from "@/shared/ui/Badges";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Form";
import { Drawer } from "@/shared/ui/Overlay";
import { Skeleton } from "@/shared/ui/Skeleton";
import { toast } from "@/shared/ui/Toast";
import { useCan } from "@/modules/auth/hooks/useCan";
import { ConfirmDialog } from "../../ui/ConfirmDialog";
import type { PeriodKey } from "../../dashboard/lib/period";
import { useReseller, useSetResellerActive, useUpdateResellerRate } from "../hooks/useResellers";
import { AVAILABILITY_DOT, AVAILABILITY_LABEL } from "../types";

/** Panneau latéral : détail, actions (activer/désactiver, commission) et clients invités. */
export function ResellerDrawer({ id, period, onClose }: { id: number | null; period: PeriodKey; onClose: () => void }) {
  const { data: r, isLoading } = useReseller(id, period);
  const canManage = useCan("resellers.manage");
  const canCommissions = useCan("commissions.view.all");
  const setActive = useSetResellerActive();
  const updateRate = useUpdateResellerRate();
  const [confirm, setConfirm] = useState(false);
  const [rate, setRate] = useState("");

  useEffect(() => {
    if (r) setRate(String(+(r.commissionRate * 100).toFixed(2)));
  }, [r]);

  const saveRate = () => {
    if (!r) return;
    const v = Number(rate.replace(",", "."));
    if (Number.isNaN(v) || v < 0 || v > 50) return toast.error("Taux invalide", "Entre 0 et 50 %.");
    updateRate.mutate({ id: r.id, rate: v / 100 }, { onSuccess: () => toast.success("Taux enregistré", `${v} %`), onError: (e) => toast.error("Échec", getErrorMessage(e)) });
  };

  const toggle = () => {
    if (!r) return;
    setActive.mutate(
      { id: r.id, active: r.status !== "actif" },
      {
        onSuccess: () => {
          toast.success(r.status === "actif" ? "Revendeur désactivé" : "Revendeur activé", r.name);
          setConfirm(false);
        },
        onError: (e) => toast.error("Échec", getErrorMessage(e)),
      },
    );
  };

  return (
    <Drawer open={id != null} onClose={onClose} title="Détail du revendeur" side="right" className="max-w-[460px]">
      {isLoading || !r ? (
        <div className="space-y-4 p-5"><Skeleton className="h-16 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-40 w-full" /></div>
      ) : (
        <div className="p-5">
          <div className="flex items-center gap-4">
            <span className="relative">
              <Avatar src={r.avatar} name={r.name} size={64} />
              <span title={AVAILABILITY_LABEL[r.availability]} className={cn("absolute bottom-0 right-0 size-4 rounded-full ring-2 ring-white", AVAILABILITY_DOT[r.availability])} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[18px] font-bold leading-[24px]">{r.name}</p>
              <p className="truncate text-[13px] text-ink-3">{r.email}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusDot tone={r.status === "actif" ? "green" : "gray"}>{r.status === "actif" ? "Actif" : "Désactivé"}</StatusDot>
                <button
                  onClick={() => navigator.clipboard?.writeText(r.codeRevendeur).then(() => toast.success("Code copié", r.codeRevendeur), () => toast.error("Copie impossible"))}
                  className="inline-flex items-center gap-1.5 rounded-md bg-chip px-2 py-0.5 text-[12px] font-bold tracking-widest hover:bg-primary hover:text-white"
                  aria-label={`Copier le code ${r.codeRevendeur}`}
                >
                  {r.codeRevendeur} <Copy size={12} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-box bg-chip p-3"><p className="text-[12px] text-ink-3">Clients invités</p><p className="text-[20px] font-bold">{r.invitedCount}</p></div>
            <div className="rounded-box bg-primary-50 p-3"><p className="text-[12px] text-ink-3">Ventes (période sélectionnée)</p><p className="text-[20px] font-bold text-primary">{formatPrice(r.salesTotal)}</p></div>
            <div className="rounded-box bg-chip p-3"><p className="text-[12px] text-ink-3">Commandes assignées</p><p className="text-[20px] font-bold">{r.ordersAssigned} <span className="text-[12px] font-medium text-ink-3">({r.ordersOpen} en cours)</span></p></div>
            <div className="rounded-box bg-chip p-3"><p className="text-[12px] text-ink-3">Conversion commande → vente</p><p className="text-[20px] font-bold">{r.conversionRate.toFixed(0)}%</p></div>
          </div>

          {canManage && (
            <div className="mt-6 rounded-box border border-line-3 p-4">
              <h4 className="text-[14px] font-bold">Actions</h4>
              <div className="mt-3 flex items-end gap-2">
                <Input wrapperClassName="flex-1" label="Taux de commission (%)" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
                <Button size="md" variant="dark" upper={false} loading={updateRate.isPending} onClick={saveRate}>Enregistrer</Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant={r.status === "actif" ? "danger" : "primary"} size="sm" upper={false} onClick={() => setConfirm(true)}>
                  {r.status === "actif" ? "Désactiver le compte" : "Réactiver le compte"}
                </Button>
                {canCommissions && (
                  <Button href={`${ROUTES.admin.commissions}?reseller=${r.id}`} variant="outline" size="sm" upper={false} leftIcon={<Wallet3 size={15} />}>Voir les commissions</Button>
                )}
              </div>
              {r.status !== "actif" && <p className="mt-3 text-[12px] leading-[18px] text-danger">Compte désactivé : ne peut plus recevoir de commandes.</p>}
            </div>
          )}

          <h4 className="mb-3 mt-6 text-[15px] font-bold">Clients invités ({r.invited.length})</h4>
          {r.invited.length === 0 ? (
            <p className="rounded-box bg-chip p-6 text-center text-[13px] text-ink-3">Aucun client invité pour le moment.</p>
          ) : (
            <RevealGroup stagger={0.04} className="flex flex-col gap-2">
              {r.invited.slice(0, 40).map((c) => (
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
          <p className="mt-6 text-center text-[12px] text-ink-3">
            <Link href={ROUTES.admin.orders} className="underline hover:text-primary">Voir les commandes</Link>
          </p>
          <ConfirmDialog
            open={confirm}
            onClose={() => setConfirm(false)}
            onConfirm={toggle}
            loading={setActive.isPending}
            tone={r.status === "actif" ? "danger" : "primary"}
            title={r.status === "actif" ? "Désactiver ce revendeur ?" : "Réactiver ce revendeur ?"}
            message={r.status === "actif" ? `${r.name} ne pourra plus recevoir de nouvelles commandes. Ses commandes en cours restent inchangées.` : `${r.name} pourra de nouveau recevoir des commandes.`}
            confirmLabel={r.status === "actif" ? "Désactiver" : "Réactiver"}
          />
        </div>
      )}
    </Drawer>
  );
}
