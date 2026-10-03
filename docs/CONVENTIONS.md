# Celebobo — Frontend (Next.js + Tailwind)

Refonte front de Celebobo, basée sur le design « Swoo » (thème vert) — police **Hanken Grotesk**, icônes **Iconsax**.
Les données viennent de l'API REST Django (Celebobo v2) : chaque module possède sa couche `services/` (mapper + appels API).

## Démarrer

```bash
npm install
cp .env.example .env.local     # API_PROXY_TARGET = URL du backend Django
npm run dev                    # http://localhost:3000
```

Le front parle à l'API Django (`/api/v1`, cf. dépôt backend). Pour un jeu de données de démonstration,
lancer `python manage.py seed_demo --admin-email <email>` côté backend (comptes listés en fin de commande).

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

Modules : `products`, `categories`, `auth`, `cart`, `favorites`, `orders`, `messaging`, `home`, `search`, `checkout`,
`account`, `assistant`, `about`, `contact`, `guide`, et `admin/{layout,ui,dashboard,analytics,products,sales,orders,resellers}`.

### Règles
- Les fichiers `app/**/page.tsx` ne contiennent **aucune logique** : `export default function Page(){ return <XxxView/> }` (+ `metadata`).
- Un composant qui utilise un hook / état / événement est `"use client"`.
- Données serveur = **React Query** (hooks dans `hooks/`), état local persistant (panier, favoris, session) = **Zustand** (`store/`).
- Jamais de `fetch` dans un composant : composant → hook → service → `api`.
- Routes : toujours `ROUTES.*` (`src/config/routes.ts`). Images locales : `/images/...`.
- Textes UI en **français**. Montants : `formatPrice()` (format `$1,689.00` du design).
- Un module importe un autre module uniquement via son `index.ts` / ses `types.ts`, jamais l'inverse en cycle.

## Design (tokens → `tailwind.config.ts`)

- Fond de page `bg-page` (#E2E4EB) ; blocs blancs `Block` / `.wh-box` (rad 10), gap vertical 16px, container 1330 (zone utile 1300).
- Vert `primary` #1ABA1A (boutons, prix « from », badges, actifs) ; rouge `danger` #F1352B (promo) ; étoiles `star` #FFA500.
- Texte `ink` #000, `ink-2` #666, `ink-3` #999 ; puces `chip` #EBEEF6 ; bordures `line` #CCC / `line-3` #DEE2E6.
- Pas d'ombre dans le thème vert (exceptions : survol de carte, popovers, toasts).
- Échelle typographique : `text-section`, `text-name`, `text-price`, `text-h-page`, `text-body`… (cf. tailwind.config.ts).
- Animations : composants `shared/animations` + keyframes Tailwind (`animate-float`, `animate-ken-burns`, `animate-marquee`, `animate-shimmer`…).
  `prefers-reduced-motion` est respecté (MotionConfig + CSS).
- Icônes : `import { Heart } from "iconsax-reactjs"` — props `size`, `variant` (`Linear` | `Bold` | `Bulk` | `TwoTone` | `Outline` | `Broken`), `color`.
  ⚠️ Vérifier qu'un nom existe avant usage (ex: `HamburgerMenu`, pas `HambergerMenu` ; pas de `Tablet` → `Devices`).

## v2 — Rôles, temps réel

- **Permissions** : `modules/auth/permissions.ts` (matrice revendeur / responsable (mukubwa) / admin). Utiliser `useCan("…")`, `<Can>`, `<PermissionGuard>`.
  Règle : *même page, données filtrées par rôle* (ex. `/admin/commandes` = toutes pour un responsable, seulement les siennes pour un revendeur).
- **Workflow commande** : `modules/orders/services/workflow.service.ts` (`orderWorkflow.setStatus/assign`, `canTransition`, `availableTransitions`) + hooks `useSetOrderStatus`, `useAssignOrder`.
  Statuts : attente → assignee → confirmee → payee → en_livraison → livree (+ annulee, retournee). Correspondance API : `STATUS_FROM_API` / `STATUS_TO_API` (`orders.mapper.ts`) ;
  la fiche commande fournit `allowedTransitions` (source de vérité des boutons).
- **Temps réel** : `shared/lib/realtime.ts` (`realtime.subscribe/emit`, canaux `conversation:{id}`, `user:{id}`, `presence`) + hook `useRealtime`.
  WebSocket `NEXT_PUBLIC_WS_URL` (passerelle Django Channels), ticket à usage unique `POST /auth/ws-ticket/`, reconnexion avec backoff.
- **Panier serveur** : invité identifié par `X-Cart-Token` (`cart.store`), fusionné dans le panier du compte à la connexion (`CartOwnerSync`).
- **Hydratation** : un état propre au navigateur (stores persistés, cache partagé avec l'en-tête) ne s'affiche qu'après `useHydrated()`.

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
- **Contrôle** : `node mcheck.mjs <rôle> [--w=390] <chemin…>` (voir le dossier d'audit) liste débordements, petites cibles et erreurs, et sauvegarde des captures.
