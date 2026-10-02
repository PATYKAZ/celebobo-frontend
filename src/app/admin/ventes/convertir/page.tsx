import type { Metadata } from "next";
import { Suspense } from "react";
import { ConvertOrderView } from "@/modules/admin/sales";

export const metadata: Metadata = { title: "Convertir une commande" };

export default function Page() {
  return (
    <Suspense>
      <ConvertOrderView />
    </Suspense>
  );
}
