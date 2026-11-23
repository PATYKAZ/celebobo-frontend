# Rendu serveur, cache et revalidation

Comment les pages de la boutique sont produites, mises en cache et rafraîchies, et ce que le conteneur front
doit recevoir pour que cela fonctionne. Ce document remplace `BACKEND_CHANGES.md` (demandes faites au backend
en octobre 2026, toutes livrées ; l'historique reste dans git).

## Quelles pages sont statiques

`npm run build` affiche la table des routes :

| Symbole | Pages | Production |
|---|---|---|
| ○ statique, `1m` | Accueil, liste des produits, recherche, contact, à propos, guide, panier, commande, compte, connexion… | Générée une fois, servie depuis le cache, **régénérée en arrière-plan au plus toutes les 60 s** (`revalidate = 60` du layout boutique) |
| ● générée à la première visite | `/produits/[slug]`, `/categorie/[slug]`, `/pages/[slug]` | `generateStaticParams()` renvoie `[]` : rien n'est généré au build ; chaque fiche est rendue à sa première visite puis mise en cache comme ci-dessus |
| ƒ dynamique | Pages privées avec un identifiant (`/compte/commandes/[number]`, `/messages/[id]`, `/admin/…/[id]`), `/revalidate`, `sitemap.xml`, `robots.txt` | Rendue à chaque requête (coquilles légères : les données sont chargées par le navigateur) |

Tout le back-office (`/admin`) est statique : ses données sont chargées par le navigateur.

**Ce qui rendrait une page boutique dynamique** (à éviter) : lire `cookies()`, `headers()` ou `searchParams` dans un
composant serveur, `dynamic = "force-dynamic"`, `revalidate = 0`, un `fetch` en `no-store`. Les filtres de la liste
des produits et de la recherche sont lus côté navigateur (`useSearchParams`), pas par le serveur.

### Devise (USD / FC)

Le choix du visiteur est gardé dans le cookie `cb_currency`, lu **par le navigateur** (`CurrencyProvider`,
`useSyncExternalStore`) : le HTML arrive en USD, React relit le cookie à l'hydratation et passe en FC si besoin.
Le serveur ne lit pas ce cookie, sans quoi toutes les pages redeviendraient dynamiques. Les montants payés restent
en USD (panier, commande, back-office).

Le thème (clair / sombre) suit le même principe : `THEME_SCRIPT` dans `<head>` (`src/shared/theme/theme.ts`).

## Données lues par le serveur

`serverGet()` (`src/shared/lib/api/server.ts`) appelle l'API sur le réseau interne, avec :
- `next: { revalidate, tags }` : la réponse est gardée dans le cache de données de Next (60 s par défaut) sous des
  étiquettes (`home`, `settings`, `categories`, `product:<slug>`, `category:<slug>`, `sitemap`…) ;
- `X-SSR-Token` : exempte le serveur Next de la limite de débit anonyme de Django (toutes les pages viennent d'une
  seule IP) ;
- `X-Forwarded-Proto` (déduit de `SITE_URL`) : sans lui, la production (`SECURE_SSL_REDIRECT`) redirigerait vers
  `https://api:8000` et le rendu serveur échouerait sans bruit ;
- un délai de 4 s : une API lente ou absente donne `null`, la page se rend sans ces données et le navigateur les charge
  (React Query reprend les données hydratées quand elles existent).

**Build Docker sans API.** L'image est construite sans `API_INTERNAL_URL` : les pages statiques sont générées vides
au build. Elles se remplissent dès la première régénération (au plus 60 s après la première visite) ; entre-temps,
le navigateur charge les données. Rien à faire au déploiement.

## Revalidation à la demande

Django appelle `POST /revalidate` après chaque modification significative (produit, prix, stock, catégorie, page,
accueil, réglages) :

```
POST {FRONTEND_REVALIDATE_URL}          # ex. https://celebobo.com/revalidate (hors /api/, servi par Next)
X-Revalidate-Secret: {FRONTEND_REVALIDATE_SECRET}
{"tags": ["product:<slug>", "category:<slug>", "home", "sitemap"]}
```

`src/app/revalidate/route.ts` : 503 si `REVALIDATE_SECRET` est absent, 401 sans le bon secret, 400 si le corps est
invalide (1 à 200 étiquettes `[a-z0-9:_-]`), sinon 200 `{ "revalidated": [...] }`. Les étiquettes expirent
aussitôt : la requête suivante attend les données fraîches. Vérifié : une modification du back-office est visible
sur la boutique en quelques secondes.

Le cache est celui du système de fichiers du conteneur : avec plusieurs conteneurs front, il faudrait un
gestionnaire de cache partagé (`cacheHandler`), sans quoi seule l'instance appelée serait revalidée.

## Session et pages protégées

`src/proxy.ts` redirige vers `/connexion` (ou vers l'accueil selon le rôle) **avant** le rendu, à partir du cookie
`cb_session` (rôle, posé par Django à la connexion et à chaque rafraîchissement, supprimé à la déconnexion). Ce
cookie n'est pas signé : il n'aiguille que l'interface, l'API vérifie tout (401/403) et `AuthGuard` reste en
place côté navigateur.

## Variables du conteneur front

À fournir **à l'exécution** (pas au build) :

| Variable | Exemple production | Rôle |
|---|---|---|
| `API_INTERNAL_URL` | `http://api:8000/api/v1` | API jointe par le serveur Next sur le réseau Docker. Vide : pas de rendu serveur des données, le site reste fonctionnel |
| `SSR_SHARED_SECRET` | secret aléatoire | Envoyé en `X-SSR-Token` ; même valeur que `SSR_SHARED_SECRET` de Django. Obligatoire avec `API_INTERNAL_URL` |
| `SITE_URL` | `https://celebobo.com` | URL canoniques, Open Graph, sitemap, JSON-LD, `X-Forwarded-Proto` |
| `REVALIDATE_SECRET` | secret aléatoire | Protège `POST /revalidate` ; même valeur que `FRONTEND_REVALIDATE_SECRET` de Django |

Variables publiques (`NEXT_PUBLIC_*`, figées au build) : voir `.env.example`.

nginx envoie au front tout ce qui n'est ni `/api` ni `/ws`, donc `/revalidate`, `/sitemap.xml` et `/robots.txt`.

## Vérifier en local

`npm run build && npm run start`, puis l'en-tête `x-nextjs-cache` d'une page boutique : `HIT` (servie depuis le
cache), `STALE` (servie, régénération en arrière-plan), `MISS` (rendue maintenant). En développement (`npm run dev`),
les pages sont toujours rendues à la demande.
