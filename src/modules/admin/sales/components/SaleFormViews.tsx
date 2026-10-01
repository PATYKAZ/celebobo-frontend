"use client";

import { useState } from "react";
import { ROUTES } from "@/config/routes";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Tabs } from "@/shared/ui/Tabs";
import { PageHeader } from "../../ui/PageHeader";
import { useSale } from "../hooks/useSales";
import { BulkSaleForm } from "./BulkSaleForm";
import { SaleForm } from "./SaleForm";

export function SaleCreateView() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  return (
    <>
      <PageHeader title="Nouvelle vente" description="Enregistrez une vente ou plusieurs ventes en une fois.">
        <Tabs variant="pill" value={mode} onChange={setMode} tabs={[{ value: "single", label: "Vente unique" }, { value: "bulk", label: "Ventes multiples" }]} />
      </PageHeader>
      {mode === "single" ? <SaleForm /> : <BulkSaleForm />}
    </>
  );
}

export function SaleEditView({ id }: { id: number }) {
  const { data, isLoading, isError } = useSale(id);
  if (isLoading) return <><PageHeader title="Modifier la vente" /><Block className="space-y-4"><Skeleton className="h-[45px]" /><Skeleton className="h-[45px]" /><Skeleton className="h-[45px]" /></Block></>;
  if (isError || !data) {
    return (
      <Block className="py-16 text-center">
        <h2 className="text-[20px]">Vente introuvable</h2>
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
