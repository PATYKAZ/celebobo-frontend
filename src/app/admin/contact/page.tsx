import type { Metadata } from "next";
import { ContactInboxView } from "@/modules/admin/contact/ContactInboxView";

export const metadata: Metadata = { title: "Messages de contact" };

export default function Page() {
  return <ContactInboxView />;
}
