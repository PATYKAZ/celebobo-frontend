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

Relevé du 11/10/2026 au soir : le palier gratuit a aussi un **quota journalier** —
`GenerateRequestsPerDayPerProjectPerModel-FreeTier`, **20 requêtes par jour** (≈ 10 questions pour tout le site).
Une fois atteint, l'assistant reste indisponible jusqu'au lendemain. Facturation Google indispensable avant la mise
en ligne. Le commit de journalisation (`03fad8f`) n'était pas encore dans l'image du conteneur API : reconstruire
l'image pour voir le statut Gemini dans les logs.

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

## A-3 · Étiquettes de revalidation des réglages (corrigé côté front, 11/10/2026)

Quand les réglages du site changent, Django revalide l'étiquette `home` ; le front mettait les réglages en cache
sous `settings` (30 min) : un nouveau taux du franc n'apparaissait qu'à l'expiration. Le front étiquette désormais
réglages et catégories `settings`/`categories` **et** `home` (cache 5 min en secours) ; côté navigateur, réglages
considérés à jour 60 s. Vérifié : taux 2300 → 2400 → 2300 visible sur la boutique en 6 s.
Si Django ajoute un jour une étiquette dédiée (`settings`), le front la gère déjà.

## A-4 · Accueil entièrement piloté par le back-office (12/10/2026)

**Objectif** : chaque bloc de la maquette d'accueil doit fonctionner avec de vraies données saisies dans le
back-office, sans rien d'écrit en dur dans le front. Aujourd'hui, seul le carrousel (bannières) vient de l'API ;
le reste était en dur dans le front, avec des produits et des prix qui n'existent pas.

**Déjà fait côté front (commit `b056472`)**
- Écran **« Bannières de l'accueil »** (`/admin/bannieres`, `content.manage`) branché sur `/bo/banners/`.
- Tant que les fonctions ci-dessous n'existent pas, chaque bloc prend de **vrais produits** de `GET /home/` :
  offre du jour = promotion la plus vendue ; mini-bannières, cartes promo et cartes latérales = promotions et
  meilleures ventes ; « Nouveau pour vous » = nouveautés ; blocs et colonnes catégories = produit le plus vendu et
  vraies catégories avec `products_count` ; marques = celles trouvées dans les noms des produits.
- **Retiré** en attendant le backend :
  - le faux compte à rebours et le faux « vendus 26/75 » ;
  - « Cadeau offert » ;
  - la bannière « 10 % cashback » ;
  - « Téléchargez notre app » (envoi par SMS simulé) ;
  - l'offre « Membres : livraison gratuite, essai 30 jours ».

  Les composants reviennent dès que l'API fournit les données.

Ordre conseillé : 4.1 → 4.2 → 4.3 → 4.4 (données), puis 4.5 et 4.6 si validés côté métier.

### 4.1 · Offre du jour (bloc « Offres du jour », compte à rebours, « vendus x / y »)

**Modèle `Deal`**

| Champ | Type | Règle |
|---|---|---|
| `product` | FK Product | Obligatoire. |
| `variant` | FK ProductVariant, nullable | Si le produit a des variantes. |
| `deal_price` | Decimal | Strictement inférieur au prix normal. |
| `starts_at` | datetime | Obligatoire. |
| `ends_at` | datetime | Strictement après `starts_at`. |
| `quantity` | int, nullable | Nombre d'unités vendues à ce prix ; vide = sans limite. |
| `gift_label` | str ≤ 80, vide possible | Pastille « Cadeau offert : … ». |
| `is_active` | bool | |

Deux offres actives d'un même produit ne doivent pas se chevaucher dans le temps.

**Règles métier**
- **Prix appliqué** : pendant la période, le prix du produit ou de la variante est `deal_price`, partout :
  - les cartes produit (`current_price`, `sale_price`) ;
  - la fiche produit ;
  - le panier ;
  - le devis de commande ;
  - la commande.
- **Fin de l'offre** : au-delà de `ends_at`, ou quand les unités vendues atteignent `quantity`, le prix normal
  revient automatiquement.
- **Unités vendues** : `sold` = quantité des lignes de commandes non annulées passées au prix de l'offre pendant
  la période. Une commande annulée rend son unité.
- **Cache des pages** : revalider l'étiquette `home` au début et à la fin de chaque offre (tâche planifiée).

**API publique** : `GET /home/` ajoute `deal`. Il vaut `null` quand aucune offre n'est en cours ; dans ce cas,
le front garde son repli actuel. Format :

```json
"deal": {
  "id": 3,
  "product": { /* même format que GET /products/{slug}/ : images[], features[], variants… */ },
  "deal_price": "399.00", "regular_price": "449.00",
  "starts_at": "…", "ends_at": "2026-10-14T21:00:00+02:00",
  "quantity": 20, "sold": 7,
  "gift_label": "Coque offerte"
}
```

`quantity` et `sold` valent `null` quand l'offre est sans limite ; le front masque alors la barre « vendus ».

**Back-office** (permission `content.manage` ou `products.manage`)
- `GET` et `POST /bo/deals/`, `PATCH` et `DELETE /bo/deals/{id}/`.
- Filtres de la liste : `?status=live|scheduled|ended`.
- Chaque offre de la liste renvoie aussi `sold`.

#### 4.1 bis · Correctif : offre sur une variante, prix faux sur la fiche produit (livré le 12/10, branche `feat/deals`)

Le front est branché :
- l'accueil affiche le compte à rebours, la barre « vendus », le cadeau et la variante ;
- l'écran `/admin/offres` gère la création, la modification, l'activation, la suppression et le filtre par statut.

Testé de bout en bout. Une offre sur un **produit simple** est juste partout.

**Bug quand l'offre porte sur une variante.** Exemple : Galaxy A55 5G, prix 449 $, promotion 419 $. La variante
« 128 Go » n'a pas de prix propre ; la variante « 256 Go » est à 489 $. Offre à 399 $ sur « 128 Go ».

L'API renvoie :

```
price = 419, sale_price = current_price = 399
variants: 128 Go → 399, 256 Go → 489
```

Le niveau produit a pris les prix de l'offre, alors qu'elle ne concerne qu'une variante. Or le front calcule le prix
d'une variante ainsi : `prix courant du produit + (prix de la variante − price du produit)`.

| Variante | Fiche produit aujourd'hui | Prix attendu |
|---|---|---|
| 128 Go | 379 $ barré 399 $ | 399 $ barré 419 $ |
| 256 Go | 469 $ barré 489 $ | 489 $, sans barré, hors offre |

Le panier facture le bon prix, puisqu'il est calculé par le serveur. Le client voit donc un prix sur la fiche et un
autre dans le panier.

**Demande**
1. **Offre sur une variante** : ne pas toucher aux champs du produit (`price`, `sale_price`, `current_price`,
   `discount_percent`), qui gardent leurs valeurs hors offre. Seule la variante concernée, dans `variants[]`, porte
   `price = deal_price`.
   - Une offre sur un produit simple reste comme aujourd'hui.
2. **Fiche produit** : ajouter `deal` à `GET /products/{slug}/`, et à la carte produit si possible. Il vaut `null`
   hors offre. Format :

   ```json
   "deal": { "id": 1, "variant_id": 1, "deal_price": "399.00", "regular_price": "419.00",
             "ends_at": "…", "quantity": 20, "sold": 0, "gift_label": "Coque offerte" }
   ```

   La fiche pourra alors afficher le prix barré juste de la variante, le compte à rebours et le cadeau. Le front
   pourra aussi présélectionner la variante en offre.
3. **`deal` de `GET /home/`** : ajouter `variant_id`. Le front retrouve aujourd'hui la variante en cherchant celle
   dont le prix vaut `deal_price`, ce qui est fragile.

### 4.2 · Marques (« Marques à la une »)

**Modèle `Brand`**

| Champ | Type |
|---|---|
| `name` | str |
| `slug` | slug unique |
| `logo` | image, URL Cloudinary, facultatif |
| `is_featured` | bool |
| `position` | int |
| `is_active` | bool |

Le produit reçoit un champ `brand` (FK nullable).

**Autour du produit**
- **Import CSV** : nouvelle colonne `brand`, renseignée par le slug ou le nom.
- **Reprise des données** : remplir `brand` à partir des noms existants (Samsung, Apple, Xiaomi, Tecno, Infinix,
  Lenovo, JBL, Sony, HP, Dell, Anker…).
- **Formulaire produit** : `brand_id` dans le POST et le PATCH de `/bo/products/`.
- **Réponses** : la fiche et la carte produit renvoient `brand: {slug, name}`.

**Liste des produits**
- Filtre `?brand=<slug>` (on peut en passer plusieurs).
- Le filtre doit aussi être disponible dans la recherche.

**API publique**
- `GET /brands/` : marques actives, avec `products_count` (produits visibles uniquement).
- `GET /home/` ajoute `brands` : les marques `is_featured`, avec au moins un produit visible, triées par
  `position`.

**Back-office**
- `GET` et `POST /bo/brands/`, `PATCH` et `DELETE /bo/brands/{id}/`.
- `POST /bo/brands/reorder/` avec `{ids}`.
- Nouveau `purpose` d'envoi `brand_logo` : PNG, SVG ou WebP, 600 px maximum.

### 4.3 · Emplacements de l'accueil (bannières au-delà du carrousel)

La maquette a d'autres visuels que le carrousel :

| Emplacement | Nombre | Bloc de la maquette |
|---|---|---|
| `hero` | n | Carrousel actuel |
| `hero_mini` | 2 | Sous le carrousel |
| `hero_side` | 2 | Grandes cartes à droite du carrousel |
| `deal_side` | 3 | Cartes à côté de l'offre du jour |
| `showcase:<slug>` | 1 par bloc | Bannière des blocs « Top smartphones », « Meilleurs ordinateurs » |
| `column:<slug>` | 1 par colonne | Bannière des colonnes catégories |

**Nouveaux champs du modèle `Banner`**

| Champ | Rôle |
|---|---|
| `placement` | Énumération des emplacements ci-dessus. Défaut `hero` : les bannières actuelles ne changent pas. |
| `product` | FK nullable. Si renseigné, la réponse inclut la carte produit, et le front affiche **son prix réel** (USD ou FC) et son lien ; sinon, `link_url`. |
| `eyebrow` | str ≤ 40 : petit sur-titre (« Audio », « Nouveau »). |
| `tone` | `light` ou `dark` : texte sombre ou clair sur l'image. |

**API publique** : `GET /home/` renvoie `banners` groupées par emplacement. Un emplacement vide utilise le
repli automatique du front.

```json
"banners": { "hero": [ … ], "hero_mini": [ … ], "deal_side": [ … ], "showcase:smartphones": [ … ] }
```

**Back-office**
- `/bo/banners/?placement=` pour filtrer la liste.
- `POST /bo/banners/reorder/` avec `{placement, ids}`, sur le modèle des zones et des catégories.
- Nouveau `purpose` d'envoi `banner` (1800 px, `content.manage`). Le front utilise aujourd'hui `product_image`,
  qui demande `products.manage`.

### 4.4 · Blocs et colonnes catégories

La maquette montre des **sous-catégories** avec leur nombre d'articles (« iPhone (iOS) », « Android »,
« Support 5G », « MacBook », « Ultrabooks »…). Deux options :

- **(a) Recommandée** : `Category.parent`, sur deux niveaux.
  - `GET /categories/` renvoie `children[]`.
  - `products_count` d'une catégorie inclut ses sous-catégories.
  - `?category=<slug parent>` inclut les produits des sous-catégories.
  - Le formulaire catégorie de l'admin aura un choix « Catégorie parente ».
- **(b)** Des étiquettes libres sur les produits (`tags`), avec un comptage.

**Disposition de l'accueil** : quelles catégories en blocs, lesquelles en colonnes, dans quel ordre.
- Modèle `HomeSection` : `kind` (`showcase` ou `column`), `category`, `title` (facultatif), `position`,
  `is_active`.
- `GET /home/` renvoie `sections[]`, chacune avec ses produits (comme `categories[]` aujourd'hui) et ses
  sous-catégories.
- `/bo/home-sections/` en CRUD, plus un `reorder`.

Aujourd'hui, le front fixe ces blocs à smartphones et ordinateurs, et les colonnes à audio, gaming et montres.

### 4.5 · Programmes commerciaux de la maquette (décision métier requise)

Ces blocs promettent des avantages au client. Ils ne s'afficheront qu'une fois la règle réellement appliquée
par l'API.

| Bloc | Ce qu'il faut côté backend |
|---|---|
| « Membres : livraison gratuite sans minimum, essai 30 jours » | Abonnement membre : statut et date de fin sur le compte, essai gratuit unique, livraison à 0 dans le devis de commande pour les membres. `GET /me/` renvoie `membership`. Les réglages portent le texte et la durée de l'essai. |
| « 10 % cashback » | Solde de cagnotte par client : crédit de x % à la livraison, débit à la commande (ligne « Cagnotte » dans le devis), historique dans `/me/wallet/`. Le taux et l'activation sont dans les réglages. |
| « Téléchargez notre app » | Ne s'affiche que si une application existe : réglages `app_store_url`, `play_store_url`. Pour l'envoi du lien par SMS : `POST /app-link/ {phone}`, avec fournisseur SMS et limitation de débit. Sinon, le front affiche les deux liens des stores. |

En attendant, il suffit d'ajouter des **drapeaux dans les réglages publics** (`membership_enabled`,
`cashback_percent`, `app_links`) : le front n'affichera un bloc que si son drapeau est actif.

### 4.6 · Réglages publics : promesses affichées partout

- **Délai de retour** :
  - aujourd'hui : écrit en dur dans le front (corrigé à 7 jours, comme les CGV de démo) ;
  - à ajouter : `return_days` dans `/settings/public/`.
- **Service client** :
  - aujourd'hui : « Hotline 24/7 » dans l'en-tête, alors que les horaires des réglages couvrent les jours
    ouvrables ;
  - à ajouter : `support_always_open` (bool), ou se baser sur les horaires.

### 4.7 · Données de démo à corriger

- **Images des bannières de démo** (`apps/demo/images.py`, `banner_image`) : le titre et le sous-titre sont
  **dessinés dans l'image**, donc affichés deux fois (une fois en net, une fois flou derrière). L'image de la
  bannière 3 contient encore « **À Kinshasa**, en 24 à 48 h ». Il faut générer des images sans texte.
- **Lien de la bannière 2** : `/categories/ordinateurs` donne une 404. La bonne adresse est
  `/categorie/ordinateurs-portables`. La correction peut aussi se faire depuis le nouvel écran admin.
- **Description de « Radio JBL Original »** : en anglais.

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
