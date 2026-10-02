import type { Metadata } from "next";
import { ROUTES } from "@/config/routes";
import { NotificationsView, StaffRedirect } from "@/modules/messaging";

export const metadata: Metadata = { title: "Notifications" };

/** Les notifications sont réservées à l'équipe : elles vivent dans le back-office. */
export default function Page() {
  return (
    <StaffRedirect to={ROUTES.admin.notifications}>
      <NotificationsView />
    </StaffRedirect>
  );
}
