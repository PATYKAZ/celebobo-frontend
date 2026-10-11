"use client";

import { getErrorMessage } from "@/shared/lib/api";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Skeleton } from "@/shared/ui/Skeleton";
import { PermissionGuard, useCan } from "@/modules/auth/hooks/useCan";
import { PageHeader } from "../../ui/PageHeader";
import { useAdminSettings } from "../hooks/useAdminSettings";
import { SettingsForm } from "./SettingsForm";
import { ShippingZonesSection } from "./ShippingZonesSection";

/**
 * Réglages du site. Zones de livraison : responsable et admin (`shipping.manage`) ; taux USD → FC, coordonnées,
 * horaires, paiements, réseaux et newsletter : admin seul (`settings.manage`, l'API répond 403 sinon).
 */
export function SettingsView() {
  return (
    <PermissionGuard permission="shipping.manage">
      <Content />
    </PermissionGuard>
  );
}

function Content() {
  const canSettings = useCan("settings.manage");
  const { data, isLoading, isError, error, refetch } = useAdminSettings(canSettings);

  return (
    <>
      <PageHeader
        title="Réglages du site"
        description={canSettings ? "Zones de livraison, taux du franc congolais, coordonnées et horaires affichés en boutique." : "Zones de livraison : villes, frais et délais proposés aux clients."}
      />
      <ShippingZonesSection />
      {canSettings &&
        (isLoading ? (
          <div role="status" aria-busy="true" className="grid gap-3 sm:gap-4">
            <span className="sr-only">Chargement des réglages…</span>
            {["h-[200px]", "h-[260px]", "h-[180px]"].map((h) => <Skeleton key={h} className={`w-full rounded-box! ${h}`} />)}
          </div>
        ) : isError || !data ? (
          <Block className="text-center">
            <p className="text-[14px] text-ink-2">{getErrorMessage(error, "Impossible de charger les réglages.")}</p>
            <Button className="mt-4" variant="chip" upper={false} onClick={() => refetch()}>Réessayer</Button>
          </Block>
        ) : (
          <SettingsForm settings={data} />
        ))}
    </>
  );
}
