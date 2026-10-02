"use client";

import { ROUTES } from "@/config/routes";
import { PermissionGuard } from "@/modules/auth/hooks/useCan";
import { Block } from "@/shared/ui/Block";
import { Button } from "@/shared/ui/Button";
import { Skeleton } from "@/shared/ui/Skeleton";
import { PageHeader } from "../../ui/PageHeader";
import { useAdminProduct } from "../hooks/useAdminProducts";
import { ProductForm } from "./ProductForm";

export function ProductCreateView() {
  return (
    <PermissionGuard permission="products.manage">
      <PageHeader title="Nouveau produit" description="Renseignez les informations, les prix, le stock et les visuels du produit." />
      <ProductForm />
    </PermissionGuard>
  );
}

export function ProductEditView({ id }: { id: number }) {
  return (
    <PermissionGuard permission="products.manage">
      <EditContent id={id} />
    </PermissionGuard>
  );
}

function EditContent({ id }: { id: number }) {
  const { data, isLoading, isError } = useAdminProduct(id);

  if (isLoading) {
    return (
      <>
        <PageHeader title="Modifier le produit" />
        <Block className="space-y-4"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-[45px] w-full" /><Skeleton className="h-24 w-full" /></Block>
      </>
    );
  }
  if (isError || !data) {
    return (
      <Block className="py-16 text-center">
        <h2 className="text-[20px]">Produit introuvable</h2>
        <p className="mt-2 text-ink-2">Ce produit n&apos;existe plus ou a été supprimé.</p>
        <Button href={ROUTES.admin.products} className="mt-6">Retour aux produits</Button>
      </Block>
    );
  }
  return (
    <>
      <PageHeader title="Modifier le produit" description={data.name} />
      <ProductForm product={data} />
    </>
  );
}
