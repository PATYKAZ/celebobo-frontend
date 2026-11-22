import type { Metadata } from "next";
import { ConsentsView } from "@/modules/consents";

export const metadata: Metadata = { title: "Mes consentements" };

export default function Page() {
  return <ConsentsView />;
}
