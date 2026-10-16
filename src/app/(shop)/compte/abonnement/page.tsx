import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Mes points fidélité" };

export default function Page() {
  redirect("/compte/points");
}
