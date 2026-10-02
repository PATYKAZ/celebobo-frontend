import type { Metadata } from "next";
import { UsersView } from "@/modules/admin/users";

export const metadata: Metadata = { title: "Utilisateurs & rôles" };

export default function Page() {
  return <UsersView />;
}
