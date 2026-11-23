# Celebobo — Frontend (Next.js + Tailwind)

Boutique et back-office de Celebobo (Next.js 16, App Router, Tailwind 4) — police **Alibaba Sans** (auto-hébergée),
icônes **Iconsax**. Les données viennent de l'API REST Django (dépôt `celebobo`) : chaque module possède sa couche
`services/` (mapper + appels API).

Autres documents : [RENDERING.md](RENDERING.md) (pages statiques, cache, revalidation, variables du conteneur) ·
[INTEGRATION_STATUS.md](INTEGRATION_STATUS.md) (fonctions de l'API encore sans écran) · règles métier :
`docs/business/` du dépôt backend.

## Démarrer

```bash
npm install
cp .env.example .env.local     # API_PROXY_TARGET = URL du backend Django
npm run dev                    # http://localhost:3000
```

Le front parle à l'API Django (`/api/v1`, cf. dépôt backend). Pour un jeu de données de démonstration,
lancer `python manage.py seed_demo --admin-email <email>` côté backend (comptes listés en fin de commande).

Contrôles (aussi lancés par la CI, `.github/workflows/ci.yml`) :

```bash
npm run typecheck
npm run lint
npm run build                  # affiche la table des routes : ○ statique, ● première visite, ƒ dynamique
npm run e2e                    # Playwright ; E2E_BASE_URL (défaut http://localhost:8080), E2E_CHANNEL=chrome
```

Les tests Playwright (`e2e/`) tournent sur le jeu `seed_demo --e2e` du backend (comptes `*@e2e.celebobo.test`).

## API Django

1. `.env.local` : `NEXT_PUBLIC_API_URL=/api/v1` + `API_PROXY_TARGET=<url du backend>` : `next.config.ts` relaie `/api/*`
   (barre oblique finale conservée) → cookies JWT/CSRF first-party, pas de CORS. Le WebSocket (`NEXT_PUBLIC_WS_URL`) se connecte directement au backend.
2. Le contrat d'endpoints est dans `src/config/endpoints.ts` (source : `/api/v1/schema/`).
3. Le client `src/shared/lib/api/client.ts` gère : cookies JWT + **CSRF Django** (`GET /auth/csrf/` à la demande), rafraîchissement du jeton sur 401,
   conversion **snake_case ⇄ camelCase**, erreurs `problem+json` (`ApiError.code`, `fieldErrors`), pagination `{ results, meta }` via `api.page()`.
   Tâches asynchrones (exports, imports, rapports) : `runJob` / `downloadJob` ; envoi d'images : `uploadMedia` (signature → Cloudinary → enregistrement).
4. Chaque module a un `services/<module>.mapper.ts` : interfaces `XxxDto` (réponse API en camelCase) + fonctions `toXxx()` vers les types du front (`types.ts`).
   Les montants arrivent en chaînes décimales → `money()` (`modules/products/services/products.mapper.ts`).
5. Produits et catégories sont adressés par **slug** (`/produits/{slug}`, `/categorie/{slug}`), les commandes client par **numéro** (`/compte/commandes/{number}`).

## Architecture

```
src/
  app/                    Routes Next (App Router). FINES : elles n'importent que des vues de modules.
    (shop)/               Boutique (header + barre verte + footer)
    admin/                Back-office (AdminShell, protégé par AuthGuard)
  config/                 env, routes, endpoints, site
  shared/                 Transverse
    ui/                   Primitives (Button, Stars, Badges, Form, Modal/Drawer, Popover, Tabs, Toast…)
    layout/               Header, GreenBar, SearchBar, Footer, Breadcrumb, ShopShell
    animations/           Reveal, CountUp, MotionImage (KenBurns/Parallax/Tilt/Float/Marquee), PageTransition
    hooks/                useCountdown, useDebounce, useMediaQuery
    lib/                  api/ (client, erreurs, tâches, envois), realtime, format, slug, cn
  modules/<module>/       UN DOSSIER PAR MODULE
    components/           Composants UI du module
    hooks/                Hooks React Query / logique
    services/             Appels API + mapper (DTO de l'API → types du front)
    store/                (si besoin) stores Zustand
    types.ts              Types du domaine
    index.ts              API publique du module
```

Un dossier par domaine dans `src/modules/` (boutique : `products`, `cart`, `checkout`, `orders`, `points`, `credit`,
`claims`, `cagnotte`…) et un par écran dans `src/modules/admin/`. Les listes paginées du back-office utilisent
`useAdminPage` (`modules/admin/ui/paged.ts`).

### Règles
- Les fichiers `app/**/page.tsx` ne contiennent **aucune logique** : `export default function Page(){ return <XxxView/> }` (+ `metadata`).
  Exception : les pages boutique rendues côté serveur (accueil, fiche produit, catégorie) chargent leurs données via
  `modules/<module>/server.ts(x)` et les passent à React Query (`HydrationBoundary`).
- **Pages boutique statiques** : aucun `cookies()`, `headers()` ni `searchParams` dans un composant serveur de la
  boutique, pas de `force-dynamic` (cf. [RENDERING.md](RENDERING.md)). Un état propre au visiteur se lit dans le navigateur.
- Un composant qui utilise un hook / état / événement est `"use client"`.
- Données serveur = **React Query** (hooks dans `hooks/`), état local persistant (panier, favoris, session) = **Zustand** (`store/`).
- Jamais de `fetch` dans un composant : composant → hook → service → `api`.
- Routes : toujours `ROUTES.*` (`src/config/routes.ts`). Images locales : `/images/...`.
- Textes UI en **français**. Montants : `formatPrice()` (format `$1,689.00` du design).
- Un module importe un autre module uniquement via son `index.ts` / ses `types.ts`, jamais l'inverse en cycle.

## Design (tokens → `@theme` de `src/app/globals.css`, Tailwind 4)

- Fond de page `bg-page` (#DFEEEB) ; blocs blancs `Block` (rad 10), gap vertical 16px, container 1330 (zone utile 1300).
- Vert sarcelle `primary` #226D68 (`primary-dark` #18534F, `primary-50` pour les fonds) : boutons, prix, badges, actifs ;
  rouge `danger` #C4261D (promo, erreurs) ; étoiles `star` #D6955B ; avertissement `warn` #8A5A00.
- Texte `ink` #000, `ink-2` #666, `ink-3` #6E6E6E ; puces `chip` #ECF8F6 ; bordures `line` #CCC / `line-3` #DEE2E6.
- Thème sombre (classe `dark` sur `<html>`, choix gardé dans le navigateur, posé avant affichage par `THEME_SCRIPT`) :
  utiliser les jetons, jamais de couleur en dur.
- Pas d'ombre dans le thème vert (exceptions : survol de carte, popovers, toasts).
- Échelle typographique : `text-section`, `text-name`, `text-price`, `text-h-page`, `text-body`… (cf. globals.css).
- Animations : composants `shared/animations` + keyframes Tailwind (`animate-float`, `animate-ken-burns`, `animate-marquee`, `animate-shimmer`…).
  `prefers-reduced-motion` est respecté (MotionConfig + CSS).
- Icônes : `import { Heart } from "@/shared/ui/icons"` — jeu local généré depuis Iconsax (`scripts/generate-icons.mjs`,
  liste dans `docs/iconsax-icons.txt`), props `size`, `variant` (`Linear` | `Bold` | `Bulk`), `color`. Pour une nouvelle
  icône : l'importer depuis `@/shared/ui/icons`, puis lancer `node scripts/generate-icons.mjs` (le script lit les imports
  et échoue si le nom n'existe pas ; vérifier dans la liste, ex. `HamburgerMenu`, pas `HambergerMenu`).

## v2 — Rôles, temps réel

- **Permissions** : la liste `permissions` envoyée par l'API dans `GET /me/` est la seule source ; `modules/auth/permissions.ts` ne fait que typer les codes consultés (aucune matrice par rôle côté UI). Utiliser `useCan("…")`, `<Can>`, `<PermissionGuard>` avec le code de l'API (ex. `orders.status.any`).
  Règle : *même page, données filtrées par rôle* (ex. `/admin/commandes` = toutes pour un responsable, seulement les siennes pour un revendeur).
- **Workflow commande** : `modules/orders/services/workflow.service.ts` (`orderWorkflow.setStatus/assign`, `canTransition`, `availableTransitions`) + hooks `useSetOrderStatus`, `useAssignOrder`.
  Statuts : attente → assignee → confirmee → payee → en_livraison → livree (+ annulee, retournee). Correspondance API : `STATUS_FROM_API` / `STATUS_TO_API` (`orders.mapper.ts`) ;
  la fiche commande fournit `allowedTransitions` (source de vérité des boutons).
- **Temps réel** : `shared/lib/realtime.ts` (`realtime.subscribe/emit`, canaux `conversation:{id}`, `user:{id}`, `presence`) + hook `useRealtime`.
  WebSocket `NEXT_PUBLIC_WS_URL` (passerelle Django Channels), ticket à usage unique `POST /auth/ws-ticket/`, reconnexion avec backoff.
- **Panier serveur** : invité identifié par `X-Cart-Token` (`cart.store`), fusionné dans le panier du compte à la connexion (`CartOwnerSync`).
- **Hydratation** : un état propre au navigateur (stores persistés, cache partagé avec l'en-tête) ne s'affiche qu'après `useHydrated()`.
  La devise d'affichage (USD / FC) est lue dans le cookie `cb_currency` par `CurrencyProvider` côté navigateur.

## Mobile (mobile-first, breakpoints Tailwind : sm 640 · md 768 · lg 1024)

- **Navigation** : < lg = barre d'onglets basse (`shared/ui/TabBar`) + feuille « Plus de pages » (`MoreSheet`, grille 4 colonnes groupée par section) ;
  ≥ lg = header/sidebar. Boutique : `shared/layout/ShopTabBar` · Back-office : `modules/admin/layout/AdminTabBar` (entrées filtrées par permission).
- **Espace réservé à la barre d'onglets** : variable CSS `--tabbar-h` (0 sur desktop ou quand la barre est masquée) → classes `pb-tabbar` / `bottom-tabbar`.
- **Primitives** (`shared/ui`) :
  - `BottomSheet` — feuille ancrée en bas (poignée, glisser pour fermer, zone sûre iOS) ; `Modal` et `ConfirmDialog` s'affichent déjà ainsi sur mobile ; `Popover` (menus « clic ») aussi (prop `sheetOnMobile`, `sheetTitle`).
  - `StickyActionBar` — barre d'actions fixe au-dessus de la barre d'onglets (formulaires, panier, paiement). Ajouter `<div className="h-20 lg:hidden" />` sous le contenu.
  - `SegmentedControl` — 2–4 choix (période, vue grille/liste) ; `Tabs` défile en rangée avec fondu et recentre l'onglet actif.
  - `ScrollRow` — rangée horizontale à accroche (chips, mini-cartes) : `<ScrollRow bleed className="gap-2">…</ScrollRow>`.
  - `Pagination` — « Précédent · 2 / 8 · Suivant » sur mobile ; `SectionHeader` garde « Voir tout › » visible.
  - `Button` : min 44–48 px de haut sous `sm` ; `QuantityStepper` 48 px ; champs `.field` 48 px / texte 16 px (pas de zoom iOS).
- **Tableaux admin** : `DataTable` devient une liste de cartes sous `md`. Indices par colonne : `mobile: "title" | "footer" | "hide"`, `mobileLabel`.
  Colonnes `select`/`checkbox` → case en haut à droite de la carte ; colonne sans en-tête / `actions` → pied de carte (boutons : `max-md:min-h-11`).
- **Règles** : jamais de défilement horizontal de page (`min-w-0` sur les enfants de grid/flex, Swiper dans un conteneur `min-w-0`) ; cibles tactiles ≥ 44 px ;
  blocs `p-4` sur mobile ; graphiques SVG mesurent leur conteneur (`useChartWidth`, largeur initiale 300) ; les infobulles de graphique s'ouvrent au toucher.
