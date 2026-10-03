import type { Metadata } from "next";
import { ROUTES } from "@/config/routes";
import { NotificationsView, StaffRedirect } from "@/modules/messaging";

export const metadata: Metadata = { title: "Notifications" };

/** Notifications du client ; l'équipe est renvoyée vers celles du back-office. */
export default function Page() {
  return (
    <StaffRedirect to={ROUTES.admin.notifications}>
      <NotificationsView />
    </StaffRedirect>
  );
}
