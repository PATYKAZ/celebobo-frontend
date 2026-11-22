import Link from "next/link";
import { ROUTES } from "@/config/routes";
import type { ConsentKind } from "../types";

const linkClass = "font-semibold text-ink underline";

/** Liens vers les documents : nouvel onglet, pour ne pas perdre le formulaire en cours. */
function Doc({ slug, children }: { slug: string; children: string }) {
  return (
    <Link href={ROUTES.page(slug)} target="_blank" rel="noopener" className={linkClass}>
      {children}
    </Link>
  );
}

/** Texte des cases à cocher : une case distincte par consentement (politique de confidentialité §3, §5, §8). */
export function ConsentLabel({ kind }: { kind: ConsentKind }) {
  switch (kind) {
    case "terms":
      return (
        <>
          J&apos;accepte les <Doc slug="conditions">conditions générales de vente</Doc> et le traitement de mes données personnelles décrit dans la{" "}
          <Doc slug="politique-de-confidentialite">politique de confidentialité</Doc>.
        </>
      );
    case "hosting_abroad":
      return (
        <>
          J&apos;accepte expressément que mes données soient hébergées hors de RDC (en Allemagne et aux États-Unis), en connaissance des risques décrits à
          l&apos;article 5 de la <Doc slug="politique-de-confidentialite">politique de confidentialité</Doc>.
        </>
      );
    case "marketing":
      return <>J&apos;accepte de recevoir les offres et nouveautés de Celebobo par SMS, WhatsApp ou e-mail (facultatif, retirable à tout moment).</>;
  }
}
