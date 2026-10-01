import type { Metadata } from "next";
import { ContactView } from "@/modules/contact";

export const metadata: Metadata = { title: "Contact" };

export default function Page() {
  return <ContactView />;
}
