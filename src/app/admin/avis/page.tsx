import type { Metadata } from "next";
import { ReviewsModerationView } from "@/modules/admin/reviews/ReviewsModerationView";

export const metadata: Metadata = { title: "Avis clients" };

export default function Page() {
  return <ReviewsModerationView />;
}
