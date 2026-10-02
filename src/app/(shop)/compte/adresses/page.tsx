import type { Metadata } from "next";
import { AddressBookView } from "@/modules/account/components/AddressBookView";

export const metadata: Metadata = { title: "Mes adresses" };

export default function Page() {
  return <AddressBookView />;
}
