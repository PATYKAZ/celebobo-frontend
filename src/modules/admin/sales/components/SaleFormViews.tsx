"use client";

import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Tabs } from "@/shared/ui/Tabs";
import { PermissionGuard, useCan } from "@/modules/auth/hooks/useCan";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { PageHeader } from "../../ui/PageHeader";
import { useSale } from "../hooks/useSales";
import { BulkSaleForm } from "./BulkSaleForm";
import { SaleForm } from "./SaleForm";

export function SaleCreateView() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const canConvert = useCan("sales.convert");
  return (
    <PermissionGuard permission="sales.create">
      <PageHeader
        title="Nouvelle vente"
        description="Enregistrez une vente, plusieurs ventes en une fois, ou convertissez une commande client."
        actions={canConvert ? <Button href={ROUTES.admin.saleConvert} variant="dark" upper={false}>Convertir une commande</Button> : undefined}
      >
        <Tabs variant="pill" value={mode} onChange={setMode} tabs={[{ value: "single", label: "Vente unique" }, { value: "bulk", label: "Ventes multiples" }]} />
      </PageHeader>
      {mode === "single" ? <SaleForm /> : <BulkSaleForm />}
    </PermissionGuard>
  );
}

function EditContent({ id }: { id: number }) {
  const { user } = useAuth();
  const canAll = useCan("sales.edit.all");
  const { data, isLoading, isError } = useSale(id);
  if (isLoading) return <><PageHeader title="Modifier la vente" /><Block className="space-y-4"><Skeleton className="h-[45px]" /><Skeleton className="h-[45px]" /><Skeleton className="h-[45px]" /></Block></>;
  const forbidden = data && !(canAll || data.seller?.id === user?.id);
  if (isError || !data || forbidden || data.status !== "valide") {
    return (
      <Block className="py-16 text-center">
        <h2 className="text-[20px]">{!data || isError ? "Vente introuvable" : forbidden ? "Modification non autorisée" : "Vente non modifiable"}</h2>
        <p className="mt-2 text-[14px] text-ink-2">{data && forbidden ? "Vous ne pouvez modifier que vos propres ventes." : data && data.status !== "valide" ? "Une vente remboursée ou retournée est figée." : ""}</p>
        <Button href={ROUTES.admin.sales} className="mt-6">Retour aux ventes</Button>
      </Block>
    );
  }
  return (
    <>
      <PageHeader title={`Modifier la vente #${data.id}`} description={data.productName} />
      <SaleForm sale={data} />
    </>
  );
}

export function SaleEditView({ id }: { id: number }) {
  return (
    <PermissionGuard permission="sales.edit.own">
      <EditContent id={id} />
    </PermissionGuard>
  );
}
