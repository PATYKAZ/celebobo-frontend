# Changements backend requis pour un bout-en-bout complet

Dépôt concerné : `shopproject_v2` (Django). Contexte : le front passe au **rendu serveur** (SEO des fiches
produit, catégories, accueil) et à une **protection des routes côté serveur** (`src/proxy.ts`).
Ces deux évolutions exigent les changements ci-dessous. Chaque point indique *pourquoi*, *quoi* et les
*critères d'acceptation* (à couvrir par des tests pytest).

Priorités : **P0** = bloquant pour la mise en production du rendu serveur · **P1** = nécessaire au bout-en-bout · **P2** = amélioration.

> **État au 11/10/2026 : tout est livré** (branche backend `feat/ssr-support`, fusionnée) **et branché côté front**,
> vérifié sur le stack Docker local :
>
> | Point | Côté front |
> |---|---|
> | P0-1 / P0-2 | Rendu serveur actif avec `API_INTERNAL_URL` + `X-SSR-Token` |
> | P0-3 | `src/proxy.ts` : redirections avant rendu, testées pour les 4 rôles et après déconnexion |
> | P1-1 | Titre / description SEO prioritaires dans les métadonnées, éditables dans les formulaires produit et catégorie ; devise du JSON-LD lue dans `/settings/public/` |
> | P1-2 | `sitemap.xml` construit depuis `GET /sitemap/` (avec `lastmod`) |
> | P1-3 | Modification back-office → webhook → `POST /revalidate` → page régénérée en ~5 s |
> | P2 | Cœurs des cartes via `GET /me/favorites/ids/` ; page Favoris passée à la liste paginée (corrige un bug : l'enveloppe paginée était traitée comme un tableau) |
>
> En local, `REVALIDATE_SECRET` et `SSR_SHARED_SECRET` de `.env.local` doivent valoir `FRONTEND_REVALIDATE_SECRET` et
> `SSR_SHARED_SECRET` du conteneur API, sinon le webhook reçoit 401.

---

## P0-1 · Limitation de débit : le rendu serveur ne doit pas épuiser le quota anonyme

**Pourquoi.** `DEFAULT_THROTTLE_RATES["anon"] = "60/min"` par IP. Avec le rendu serveur, toutes les pages
anonymes sont demandées par le serveur Next (une seule IP) : au-delà de 60 pages vues/minute sur tout le site,
l'API répond 429 et les pages cassent. `NUM_PROXIES` n'est pas défini : DRF identifie alors le client par
l'en-tête `X-Forwarded-For` brut (falsifiable) ou par `REMOTE_ADDR`.

**Quoi.**
- Classe de throttle `SsrAwareAnonRateThrottle` (remplace `AnonRateThrottle`) : si la requête porte
  `X-SSR-Token: <secret>` égal à `SSR_SHARED_SECRET` (comparaison à temps constant), elle n'est pas limitée.
  Le secret n'est connu que du serveur Next (variable non `NEXT_PUBLIC_`).
- Définir `NUM_PROXIES` (nombre de proxys devant Django : nginx = 1) pour que l'identification des clients
  réels redevienne fiable.

**Acceptation.** 200 GET anonymes/min avec le bon secret → aucun 429 ; sans secret ou avec un faux → 429 au 61ᵉ ;
le secret n'apparaît dans aucune réponse ni aucun log.

## P0-2 · Accès interne du serveur Next à l'API

**Pourquoi.** Le serveur Next appellera Django directement (réseau Docker), sans passer par nginx.

**Quoi.**
- Accepter l'hôte interne (ex. `web:8000`) dans `ALLOWED_HOSTS` (variable d'environnement).
- En production, une requête interne en HTTP ne doit pas être redirigée vers HTTPS (`SECURE_SSL_REDIRECT`) :
  faire confiance à `X-Forwarded-Proto: https` envoyé par Next (`SECURE_PROXY_SSL_HEADER`) ou exempter l'hôte interne.
- Documenter dans `deploy/.env.*.example` : `SSR_SHARED_SECRET`, l'hôte interne.

**Acceptation.** Depuis le conteneur front : `GET http://web:8000/api/v1/products/<slug>/` → 200 JSON (pas de 301/400).

**Constaté le 10/10 sur le stack local** : depuis un conteneur front sur le réseau `celebobo-local_default`,
`GET http://api:8000/api/v1/products/?page_size=1` → **400** (hôte `api` absent de `ALLOWED_HOSTS`). Le rendu serveur
a été validé en contournant (conteneur front dans l'espace réseau de nginx, hôte `localhost`) : sitemap 26 produits,
accueil 16 fiches, canonique correcte. Il ne manque donc que ce réglage côté Django.

## P0-3 · Indicateur de session lisible par le serveur Next (cookie `cb_session`)

**Pourquoi.** `cb_access` (Path=/) expire au bout de 15 min et `cb_refresh` n'est envoyé que sous `/api/`.
En naviguant vers `/admin` après 15 min d'inactivité, le serveur Next ne voit aucun cookie alors que la session
est valide : impossible de décider « connecté / pas connecté » sans appel réseau.

**Quoi.** Un cookie `cb_session` :
- valeur = rôle (`client` | `revendeur` | `mukubwa` | `admin`) ; `HttpOnly`, `Path=/`, `SameSite=Lax`,
  `Secure` en production, `Max-Age` = durée de vie du refresh (14 j) ;
- posé à la connexion (mot de passe **et** Google), à l'inscription si elle connecte, à chaque rotation du refresh,
  et mis à jour si le rôle change ;
- supprimé à la déconnexion, quand le refresh est refusé (blacklist, expiré) et quand le compte est désactivé.

Ce cookie ne donne **aucun droit** : il sert seulement à rediriger l'interface. L'API continue de tout vérifier (401/403).
(Alternative écartée : passer `cb_refresh` en `Path=/`, ce qui exposerait le jeton de rafraîchissement à chaque page.)

**Acceptation.** Tests sur login, login Google, refresh, logout, refresh refusé, changement de rôle :
présence, valeur et suppression du cookie.

---

## P1-1 · Données SEO du catalogue

**Pourquoi.** Métadonnées par page (`<title>`, description, Open Graph) et données structurées `Product` (JSON-LD).

**Quoi** (produit ; idem catégorie pour titre/description/image/`updated_at`) :
- `seo_title` et `seo_description` (facultatifs, vides par défaut ; le front retombe sur `name` / `description`),
  modifiables dans le back-office (sérialiseurs backoffice + import CSV) ;
- `updated_at` dans la fiche **et** la carte produit ;
- `currency` (ISO 4217, ex. `USD`) : dans les réglages du site ou sur chaque prix ; le front affiche aujourd'hui `$` en dur ;
- `brand` si la notion existe, `sku` au niveau produit (sinon le JSON-LD se limite aux variantes) ;
- URL d'images **absolues** (`https://res.cloudinary.com/...`) dans `image`, `images[]`, `variants[].image`.

**Acceptation.** Schéma OpenAPI régénéré (`openapi.yml`) ; tests des sérialiseurs (valeurs par défaut, URL absolues).

## P1-2 · Endpoint sitemap

**Quoi.** `GET /api/v1/sitemap/` (public, `@public_cache`) :
`{ products: [{slug, updated_at}], categories: [{slug, updated_at}], pages: [{slug, updated_at}] }`,
uniquement les éléments actifs/publiés, requêtes légères (`values()`), sans pagination jusqu'à 50 000 entrées.

**Acceptation.** Un produit désactivé ou supprimé (safe delete) n'apparaît pas ; temps de réponse < 200 ms sur le jeu de démo.

## P1-3 · Revalidation du cache des pages Next

**Pourquoi.** Les pages rendues côté serveur seront mises en cache (quelques minutes) ; une modification dans le
back-office doit se voir sans attendre.

**Quoi.** À chaque modification significative (création, édition, suppression ; prix, promo, passage en/hors stock ;
catégorie ; page CMS ; contenu de l'accueil ; réglages du site), une tâche asynchrone (`core.events`) envoie :
```
POST {FRONTEND_REVALIDATE_URL}          # ex. https://celebobo.com/revalidate  (hors /api/, servi par Next)
X-Revalidate-Secret: {FRONTEND_REVALIDATE_SECRET}
{"tags": ["product:<slug>", "category:<slug>", "home", "sitemap"]}
```
Délai maximal 5 s, 3 nouvelles tentatives avec backoff ; un échec ne bloque jamais l'écriture.
Regrouper les envois lors d'un import CSV (un seul appel avec tous les tags).

**Acceptation.** Tests : bonnes étiquettes par type de modification ; aucun envoi si la variable est vide ; écriture réussie même si Next est injoignable.

**État côté front : prêt.** `POST /revalidate` est implémenté (`src/app/revalidate/route.ts`) : 401 sans le bon
secret, 400 si le corps est invalide, 200 `{ "revalidated": [...] }` sinon. Étiquettes reconnues :
`product:<slug>`, `category:<slug>`, `home`, `sitemap`. `FRONTEND_REVALIDATE_SECRET` (Django) = `REVALIDATE_SECRET` (front).

## P1-4 · Jeu de données et environnement pour les tests bout-en-bout (Playwright)

**Quoi.**
- `seed_demo --e2e` : déterministe et rejouable — un compte par rôle (client, revendeur, mukubwa, admin) avec mots de
  passe fixes, produits et slugs fixes (dont un en promo, un en rupture, un avec variantes), un code promo, une zone de livraison ;
- réinitialisation rapide de la base pour la CI (`flush` + seed, ou base de test dédiée) ;
- e-mails capturés en local (ex. Mailpit dans `deploy/compose`) pour tester inscription → vérification → réinitialisation du mot de passe.

**Acceptation.** `./deploy/local.sh up && manage.py seed_demo --e2e` deux fois de suite → même état.

---

## P2 · Améliorations

- **Favoris hors carte produit** : `is_favorite` rend la liste/fiche produit dépendante de l'utilisateur, donc non
  cachable. Exposer `GET /api/v1/favorites/ids/` et rendre la fiche identique pour tous (cachable via `@public_cache`).
- **Idempotence** : `core/api/idempotency.py` existe ; vérifier qu'elle couvre bien `POST` commande, vente, paiement de
  commission, avec un test « deux envois de la même clé → une seule commande ».
- **Erreurs** : garder `problem+json` partout (y compris 429 avec `Retry-After`), le front s'appuie sur `fieldErrors`.

## A-1 · Assistant : réponses hors sujet (diagnostic du 11/10/2026)

**Symptôme.** À « un smartphone Samsung à moins de 400 $ », l'assistant propose un Galaxy S24 à 899 $, des
écouteurs et une Nintendo Switch ; à « quels sont les délais de livraison ? », la même liste de produits, toujours
avec la phrase fixe « Voici ce que je vous propose : … ».

**Cause : configuration backend.** Le conteneur API tourne avec `ASSISTANT_PROVIDER=offline` et une
`GEMINI_API_KEY` vide. L'adaptateur `offline` (`apps/assistant/adapters/offline.py`) est un bouchon de test :
recherche par empreinte de mots (hachage), sans compréhension du sens, qui transmet la question brute à l'outil de
recherche (ni catégorie ni prix maximum) et répond par un gabarit. Le vrai modèle (`gemini`) appelle la même
recherche avec `category` et `max_price` : le problème disparaît dès qu'il est activé.

**À faire (backend / déploiement)**
1. Renseigner `GEMINI_API_KEY` et `ASSISTANT_PROVIDER=gemini` (production et, pour tester, `deploy/.env.local`).
2. Réindexer le catalogue après le changement de fournisseur : `POST /api/v1/bo/embeddings/reindex/` (les vecteurs
   actuels viennent de l'empreinte hors ligne et ne sont pas comparables à ceux de Gemini ; l'empreinte de contenu
   inclut le nom du moteur, la réindexation les recalcule tous).
3. Échouer au démarrage si `ASSISTANT_PROVIDER=gemini` sans clé : aujourd'hui chaque message lèverait une erreur
   (500) et l'utilisateur ne verrait que « problème technique ».
4. Recommandé : que le bouchon `offline` réponde « assistant indisponible » plutôt que des produits au hasard, s'il
   peut être actif ailleurs qu'en test.

**Critères d'acceptation** : la question « Samsung à moins de 400 $ » ne renvoie que des produits Samsung ≤ 400 $
(ou dit qu'il n'y en a pas) ; une question sur la livraison obtient une réponse sur la livraison, sans cartes produits.

**Côté front (corrigé)** : historique effacé à l'ouverture en plein écran ou au rechargement ; délai de 25 s qui
aurait coupé les réponses longues du vrai modèle (porté à 90 s ; nginx en accorde 120).

### Suivi après passage à Gemini (11/10/2026)

Fait : `ASSISTANT_PROVIDER=gemini`, clé renseignée, catalogue réindexé (26 produits en `gemini-embedding-001`,
4 s). Les réponses sont désormais pertinentes : « Samsung à moins de 400 $ » → « pas de Samsung sous 400 $ » et
des alternatives dans le budget ; « livraison à Kinshasa » → « 24 à 48 h », sans cartes produits ; « cadeau audio,
150 $ » → recherche `category=audio, max_price=150`, trois produits ≤ 150 $.

**Nouveau problème bloquant : quota Google.** La clé est sur le palier gratuit : `GenerateRequestsPerMinutePerProjectPerModel-FreeTier`,
**5 requêtes par minute pour tout le projet**. Chaque question coûte 2 requêtes (recherche puis rédaction) : le site
entier traite 2 à 3 questions par minute ; au-delà Google répond 429 et l'utilisateur voit « assistant
indisponible ». La limite applicative (12 messages/min par utilisateur) ne protège donc rien.

À faire :
1. Activer la facturation du projet Google (palier payant) ou changer de modèle/plan avant la mise en ligne.
2. Journaliser la cause des `AssistantUnavailable` (`apps/assistant/adapters/gemini.py` lève sans trace : il a fallu
   rejouer la question dans un shell pour voir le 429).
3. Distinguer le 429 (`assistant_busy` + délai `Retry-After` / `retryDelay` de Google) d'une vraie panne ; le front
   affichera alors « très sollicité, réessayez dans N s ».
4. Aligner la limite applicative sur le quota réel (globale, pas seulement par utilisateur).

Côté front (fait) : message du serveur affiché + bouton « Réessayer » ; réponses en Markdown mises en forme
(gras, italique, listes) au lieu des astérisques.

## A-2 · Zone de service : Bukavu et Goma d'abord, pas Kinshasa (11/10/2026)

La boutique sert d'abord **Bukavu et Goma**, puis leurs environs, puis le reste du pays. Le front ne contient plus
aucune mention de Kinshasa ; tout ce qui reste vient du backend.

**Logique et configuration (à corriger en priorité)**
| Où | Aujourd'hui | Impact |
|---|---|---|
| `config/settings/base.py` `TIME_ZONE`, `.env.example`, `deploy/.env.*.example` | `Africa/Kinshasa` (UTC+1) | Bukavu et Goma sont en **`Africa/Lubumbashi` (UTC+2)** : heures des commandes, « aujourd'hui », rapports et quotas décalés d'une heure |
| `apps/orders/migrations/0003_seed_shipping_zones.py` | zones « Kinshasa » (2,98 $, offerte dès 199 $, 24–48 h) et « Autres villes » (7,50 $, 3–7 j) | un client de Bukavu ou Goma paie le tarif « autres villes » ; prévoir Bukavu, Goma, leurs environs, puis le reste du pays |
| Base locale (après le jeu E2E) | `GET /shipping/zones/` renvoie `[]` | aucune zone : tarif tiré des réglages du site |
| `apps/assistant/domain/prompts.py` | « boutique… à Kinshasa », « livraison à Kinshasa 24 à 48 h » | l'assistant répond Kinshasa à tous les clients |
| `apps/documents/conf.py`, `DOCUMENTS_COMPANY_ADDRESS` | « Kinshasa, RD Congo » | adresse imprimée sur les factures et documents |

**Données affichées sur le site (seeder de démo et base actuelle)**
| Où | Texte |
|---|---|
| Réglages du site (`GET /settings/public/` `address`, `apps/demo/seeder.py`) | « Avenue du Commerce 12, Gombe, Kinshasa » (pied de page, contact) |
| Bannière d'accueil (`apps/demo/content.py`) | « Livraison offerte dès 199 $ — À Kinshasa, en 24 à 48 h » |
| Pages « À propos » et « Guide », FAQ (`apps/demo/content.py`) | « née à Kinshasa », « livraison rapide à Kinshasa », « 2,98 $ à Kinshasa », paiement à la livraison « à Kinshasa » |
| Politique de livraison des produits (`apps/demo/seeder.py`) | « Livraison en 24 à 48 h à Kinshasa » (onglet Livraison de chaque fiche) |
| Avis client de démo, personnes de démo (`apps/demo/people.py`, `e2e.py`) | quartiers de Kinshasa (Gombe, Limete…) |

Aussi : `docs/business/*`, `README.md`, et 33 occurrences dans les tests.

**Back-office (fait côté front)** : écran « Réglages du site » (`/admin/reglages`) — zones de livraison
(responsable et admin, `/bo/shipping-zones/`) ; taux USD → FC, coordonnées dont l'adresse, horaires, moyens de
paiement, réseaux, newsletter (admin seul, `/bo/settings/`). L'adresse et les zones se corrigent donc sans
développeur ; il reste à les saisir (adresse réelle, zones Bukavu / Goma / environs / reste du pays).

## Déploiement (`deploy/` du dépôt backend) · variables du conteneur front

Le rendu serveur est en place côté front (fiches produit, catégories, accueil, sitemap). Le conteneur front doit recevoir
ces variables **à l'exécution** (pas au build) :

| Variable | Exemple production | Rôle |
|---|---|---|
| `API_INTERNAL_URL` | `http://api:8000/api/v1` | API jointe par le serveur Next sur le réseau Docker (P0-2). Vide → pas de rendu serveur, le site reste fonctionnel. |
| `SSR_SHARED_SECRET` | secret aléatoire | Envoyé en `X-SSR-Token` ; même valeur que `SSR_SHARED_SECRET` de Django (P0-1). |
| `SITE_URL` | `https://celebobo.com` | URL canoniques, Open Graph, sitemap, JSON-LD. |
| `REVALIDATE_SECRET` | secret aléatoire | Protège `POST /revalidate` ; même valeur que `FRONTEND_REVALIDATE_SECRET` de Django (P1-3). |

nginx doit envoyer `/revalidate`, `/sitemap.xml` et `/robots.txt` vers Next (c'est déjà le cas : tout ce qui n'est ni
`/api` ni `/ws` va au front). P0-1 étant livré, `API_INTERNAL_URL` peut être renseignée en production, **avec**
`SSR_SHARED_SECRET` : sans le jeton, le rendu serveur retomberait sous la limite anonyme (60/min).

## Déjà vérifié (aucun changement)

- `private_key.pem` / `public_key.pem` sont ignorés par git.
- `CSRF_TRUSTED_ORIGINS` du stack local inclut `http://localhost:8080` et `:3000`.
- Les vues produit ne sont pas en cache public (elles dépendent de l'utilisateur) : pas de fuite entre comptes.
- `/health/` existe (utilisable par la CI pour attendre que l'API soit prête).
