/**
 * URL publique du site (URL canoniques, Open Graph, sitemap, JSON-LD). Lue côté serveur à l'exécution :
 * une même image Docker sert n'importe quel domaine. Ex. https://celebobo.com ; en local http://localhost:8080.
 */
export const siteUrl = () => (process.env.SITE_URL ?? "http://localhost:8080").replace(/\/$/, "");
