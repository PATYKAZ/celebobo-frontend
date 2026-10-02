import type { Metadata } from "next";
import { ROUTES } from "@/config/routes";
import { MessagesView, StaffRedirect } from "@/modules/messaging";

export const metadata: Metadata = { title: "Messages" };

export default function Page() {
  return (
    <StaffRedirect to={ROUTES.admin.inbox}>
      <MessagesView />
    </StaffRedirect>
  );
}
