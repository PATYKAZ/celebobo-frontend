import type { User } from "../types";

/** Comptes de démonstration (mode mock). Mot de passe : n'importe lequel (≥ 4 caractères). */
export const DEMO_ACCOUNTS: { label: string; login: string; user: User }[] = [
  {
    label: "Client",
    login: "client@celebobo.com",
    user: { id: 1, username: "client", email: "client@celebobo.com", firstName: "Aline", lastName: "Mbuyi", role: "client", avatar: "/images/avatars/avatar-2.jpg", phoneNumber: "+243 990 112 233" },
  },
  {
    label: "Revendeur",
    login: "revendeur@celebobo.com",
    user: { id: 2, username: "revendeur", email: "revendeur@celebobo.com", firstName: "Patrick", lastName: "Kabasele", role: "revendeur", avatar: "/images/avatars/avatar-1.jpg", phoneNumber: "+243 810 445 566", codeRevendeur: "4821" },
  },
  {
    label: "Responsable (mukubwa)",
    login: "mukubwa@celebobo.com",
    user: { id: 3, username: "mukubwa", email: "mukubwa@celebobo.com", firstName: "Joël", lastName: "Tshimanga", role: "mukubwa", avatar: "/images/avatars/avatar-3.jpg", phoneNumber: "+243 970 778 899" },
  },
  {
    label: "Administrateur",
    login: "admin@celebobo.com",
    user: { id: 4, username: "admin", email: "admin@celebobo.com", firstName: "Célestin", lastName: "Admin", role: "admin", avatar: "/images/avatars/avatar-3.jpg", phoneNumber: "+243 999 000 111" },
  },
];

export const resolveDemoUser = (login: string): User | undefined => {
  const l = login.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((a) => a.login === l || a.user.username === l)?.user;
};
