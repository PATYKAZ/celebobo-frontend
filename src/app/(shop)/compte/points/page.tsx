import type { Metadata } from "next";
import { PointsView } from "@/modules/points";

export const metadata: Metadata = { title: "Mes points" };

export default function Page() {
  return <PointsView />;
}
