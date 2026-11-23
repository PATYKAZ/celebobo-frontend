import type { Metadata } from "next";
import { StoreCreditView } from "@/modules/credit/StoreCreditView";

export const metadata: Metadata = { title: "Mon avoir" };

export default function Page() {
  return <StoreCreditView />;
}
