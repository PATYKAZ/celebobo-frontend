import type { Metadata } from "next";
import { NotFoundView } from "@/modules/errors";

export const metadata: Metadata = { title: "Page introuvable" };

export default function NotFound() {
  return <NotFoundView />;
}
