import type { Metadata } from "next";
import { StandingView } from "@/modules/admin/standing/StandingView";

export const metadata: Metadata = { title: "Niveau et sanctions" };

export default function Page() {
  return <StandingView />;
}
