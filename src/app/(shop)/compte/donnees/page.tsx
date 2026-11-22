import type { Metadata } from "next";
import { MyDataView } from "@/modules/account/components/MyDataView";

export const metadata: Metadata = { title: "Mes données" };

export default function Page() {
  return <MyDataView />;
}
