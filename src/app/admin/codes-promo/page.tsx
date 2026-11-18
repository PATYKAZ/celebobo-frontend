import type { Metadata } from "next";
import { CouponsView } from "@/modules/admin/coupons";

export const metadata: Metadata = { title: "Codes promo" };

export default function Page() {
  return <CouponsView />;
}
