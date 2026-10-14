/**
 * Pictogramme du logo : sac blanc sur carré teal arrondi, barré des deux traits du logo « CeLE BoBO ».
 * Même dessin que l'icône de l'onglet (app/icon.svg) et l'icône d'application (app/apple-icon.png).
 */
const TEAL = "#226d68";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="12" fill={TEAL} />
      <path d="M11 15h18l1.4 14a2.4 2.4 0 0 1-2.4 2.6H12a2.4 2.4 0 0 1-2.4-2.6z" fill="#fff" />
      <path d="M15.5 15v-2a4.5 4.5 0 0 1 9 0v2" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="13" y="20" width="14" height="1.8" rx=".9" fill={TEAL} />
      <rect x="13" y="26" width="14" height="1.8" rx=".9" fill={TEAL} />
    </svg>
  );
}
