import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminFormSkeleton } from "@/modules/admin/ui/AdminSkeletons";
import { ConvertOrderView } from "@/modules/admin/sales";

export const metadata: Metadata = { title: "Convertir une commande" };

export default function Page() {
  return (
    <Suspense fallback={<AdminFormSkeleton />}>
      <ConvertOrderView />
    </Suspense>
  );
}
