import type { Metadata } from "next";
import { ProfileView } from "@/modules/account";

export const metadata: Metadata = { title: "Mon profil" };

export default function Page() {
  return <ProfileView />;
}
