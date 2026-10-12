import { NextResponse, type NextRequest } from "next/server";

/**
 * Redirection côté serveur des pages réservées, avant tout rendu : plus de flash de spinner ni de page
 * protégée servie à un visiteur anonyme. Simple aiguillage d'interface : `cb_session` (rôle, posé par
 * Django à la connexion et au rafraîchissement) n'est pas signé ; la sécurité reste côté API (401/403)
 * et AuthGuard reste en place côté client.
 */
const BACK_OFFICE_ROLES = new Set(["admin", "manager", "reseller"]);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const role = request.cookies.get("cb_session")?.value;
  // session ouverte avant l'arrivée de cb_session : le jeton d'accès suffit, le rafraîchissement posera le rôle
  const signedIn = !!role || request.cookies.has("cb_access");

  if (!signedIn) {
    const login = new URL("/connexion", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }
  if (pathname.startsWith("/admin") && role && !BACK_OFFICE_ROLES.has(role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/compte/:path*", "/commande/:path*", "/messages/:path*", "/notifications/:path*"],
};
