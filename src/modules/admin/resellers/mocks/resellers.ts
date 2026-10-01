import { rng } from "../../dashboard/mocks/seeded";
import type { InvitedClient, Reseller } from "../types";

const FIRST = ["Patrick", "Grâce", "Jonathan", "Chancelle", "Merveille", "Dieudonné", "Béatrice", "Samuel", "Nadège", "Christian", "Esther", "Rodrigue", "Prisca", "Héritier"];
const LAST = ["Kabasele", "Kalala", "Luzolo", "Bakole", "Tuta", "Mpia", "Ilunga", "Mukendi", "Ngoy", "Tshibola", "Kasongo", "Mawete"];
const AVATARS = ["/images/avatars/avatar-1.jpg", "/images/avatars/avatar-2.jpg", "/images/avatars/avatar-3.jpg", null, null];

function build(): Reseller[] {
  const r = rng("resellers-fixed");
  return Array.from({ length: 23 }, (_, i) => {
    const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 5) % LAST.length]}`;
    const invitedCount = Math.floor(r() * 26) + (i < 3 ? 14 : 0);
    const invited: InvitedClient[] = Array.from({ length: invitedCount }, (_, j) => ({
      id: i * 100 + j,
      name: `${FIRST[(i + j * 3) % FIRST.length]} ${LAST[(j * 7 + i) % LAST.length]}`,
      email: `client${i}${j}@mail.com`,
      joinedAt: new Date(Date.now() - (j * 5 + r() * 20) * 86400000).toISOString(),
      ordersCount: Math.floor(r() * 6),
    }));
    return {
      id: 200 + i,
      name,
      email: `${name.split(" ")[0].toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}@celebobo.com`,
      avatar: AVATARS[i % AVATARS.length],
      codeRevendeur: String(1000 + Math.floor(r() * 8999)),
      invitedCount,
      salesTotal: Math.round(invited.reduce((s, c) => s + c.ordersCount, 0) * (180 + r() * 240)),
      joinedAt: new Date(Date.now() - (30 + i * 17 + r() * 12) * 86400000).toISOString(),
      status: r() > 0.18 ? "actif" : "inactif",
      invited,
    };
  });
}

export const MOCK_RESELLERS: Reseller[] = build();
