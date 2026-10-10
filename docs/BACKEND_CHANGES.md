# Changements backend requis pour un bout-en-bout complet

Dépôt concerné : `shopproject_v2` (Django). Contexte : le front passe au **rendu serveur** (SEO des fiches
produit, catégories, accueil) et à une **protection des routes côté serveur** (`src/proxy.ts`).
Ces deux évolutions exigent les changements ci-dessous. Chaque point indique *pourquoi*, *quoi* et les
*critères d'acceptation* (à couvrir par des tests pytest).

Priorités : **P0** = bloquant pour la mise en production du rendu serveur · **P1** = nécessaire au bout-en-bout · **P2** = amélioration.

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

## Déjà vérifié (aucun changement)

- `private_key.pem` / `public_key.pem` sont ignorés par git.
- `CSRF_TRUSTED_ORIGINS` du stack local inclut `http://localhost:8080` et `:3000`.
- Les vues produit ne sont pas en cache public (elles dépendent de l'utilisateur) : pas de fuite entre comptes.
- `/health/` existe (utilisable par la CI pour attendre que l'API soit prête).
