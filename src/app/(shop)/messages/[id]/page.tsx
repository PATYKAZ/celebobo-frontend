import type { Metadata } from "next";
import { ROUTES } from "@/config/routes";
import { MessagesView, StaffRedirect } from "@/modules/messaging";

export const metadata: Metadata = { title: "Discussion" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = Number(id);
  const valid = Number.isFinite(n) && n > 0;
  return (
    <StaffRedirect to={valid ? ROUTES.admin.conversation(n) : ROUTES.admin.inbox}>
      <MessagesView initialId={valid ? n : null} />
    </StaffRedirect>
  );
}
