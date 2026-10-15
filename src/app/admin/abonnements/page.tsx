import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Programmes de fidélité" };

export default function Page() {
  redirect("/admin/fidelite");
}
