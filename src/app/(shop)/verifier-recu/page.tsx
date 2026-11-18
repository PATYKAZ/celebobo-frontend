import type { Metadata } from "next";
import { Suspense } from "react";
import { FormPageSkeleton } from "@/shared/ui/PageSkeletons";
import { ReceiptVerificationView } from "@/modules/receipts/components/ReceiptVerificationView";

export const metadata: Metadata = { title: "Vérifier un reçu de livraison" };

export default function Page() {
  return (
    <Suspense fallback={<FormPageSkeleton fields={2} />}>
      <ReceiptVerificationView />
    </Suspense>
  );
}
