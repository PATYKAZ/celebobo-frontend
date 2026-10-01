"use client";

/** Dernier recours (erreur dans le layout racine) : HTML minimal sans dépendance aux providers. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#E2E4EB", minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div style={{ background: "#fff", borderRadius: 10, padding: 40, textAlign: "center", maxWidth: 420 }}>
          <h1 style={{ margin: 0, fontSize: 26 }}>Une erreur est survenue</h1>
          <p style={{ color: "#666", lineHeight: 1.5 }}>Veuillez réessayer. Si le problème persiste, contactez-nous.</p>
          <button onClick={reset} style={{ background: "#1ABA1A", color: "#fff", border: 0, borderRadius: 10, padding: "12px 24px", fontWeight: 700, cursor: "pointer" }}>
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
