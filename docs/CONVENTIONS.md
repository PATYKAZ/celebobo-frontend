# Celebobo — Frontend (Next.js + Tailwind)

Refonte front de Celebobo, basée sur le design « Swoo » (thème vert) — police **Hanken Grotesk**, icônes **Iconsax**.
Le backend Django (voir ancien dépôt `shopproject-cele`) sera branché via une API REST : **le front est prêt**, chaque module possède sa couche `services/` avec une branche **mock** et une branche **API réelle**.

## Démarrer

```bash
cd frontend
npm install
cp .env.example .env.local     # NEXT_PUBLIC_USE_MOCKS=true par défaut
npm run dev                    # http://localhost:3000
```

Comptes démo (mode mock, mot de passe : ≥ 4 caractères) : `client@celebobo.com`, `revendeur@celebobo.com`,
`mukubwa@celebobo.com`, `admin@celebobo.com` (accès `/admin`). La page de connexion propose des boutons « démo ».

## Brancher l'API Django

1. `.env.local` : `NEXT_PUBLIC_API_URL=http://localhost:8000/api` et `NEXT_PUBLIC_USE_MOCKS=false`
   (ou `NEXT_PUBLIC_API_URL=/api` + `API_PROXY_TARGET=http://localhost:8000` pour éviter CORS).
2. Le contrat d'endpoints est dans `src/config/endpoints.ts` (avec la correspondance vers les anciennes URLs Django).
3. Le client `src/shared/lib/api/client.ts` gère : cookies de session + **CSRF Django**, conversion **snake_case ⇄ camelCase**
   automatique, erreurs typées (`ApiError`), 401 → déconnexion, pagination DRF `{count,next,previous,results}`.
4. Les types de réponse attendus sont dans `modules/*/types.ts` (camelCase côté front = snake_case côté Django).
5. Dans chaque `services/*.service.ts`, supprimer la branche `if (env.USE_MOCKS) {...}` quand l'endpoint existe.

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
    lib/                  api/ (client, mock helpers), format, cn
  modules/<module>/       UN DOSSIER PAR MODULE
    components/           Composants UI du module
    hooks/                Hooks React Query / logique
    services/             Appels API (branche mock + branche réelle)
    store/                (si besoin) stores Zustand
    mocks/                Données de démonstration
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

## v2 — Rôles, base de démo unique, temps réel

- **Permissions** : `modules/auth/permissions.ts` (matrice revendeur / responsable (mukubwa) / admin). Utiliser `useCan("…")`, `<Can>`, `<PermissionGuard>`.
  Règle : *même page, données filtrées par rôle* (ex. `/admin/commandes` = toutes pour un responsable, seulement les siennes pour un revendeur).
- **Base de démo unique** : `shared/mock-db` (`DB.users`, `DB.orders`, `DB.sales`, `DB.commissionPayments`, `DB.stockMovements`, `DB.auditLog`, `DB.addresses`)
  + `shared/mock-db/selectors.ts` (`getActor`, `visibleSales`, `totals`, `resellerStats`, `commissionFor`, `topReseller`, `logAudit`…).
  Tous les services mock lisent/mutent ces tableaux → les chiffres concordent entre écrans. Jamais de données aléatoires dans un module.
  Sémantique v1 conservée : `Vente.seller` = vendeur (revendeur/responsable), `soldTo` = acheteur (texte libre).
- **Workflow commande** : `modules/orders/services/workflow.service.ts` (`orderWorkflow.setStatus/assign`, `canTransition`, `availableTransitions`) + hooks `useSetOrderStatus`, `useAssignOrder`.
  Statuts : attente → assignee → confirmee → payee → en_livraison → livree (+ annulee, retournee). Mapping API v1 : `fromLegacyStatus`.
- **Temps réel** : `shared/lib/realtime.ts` (`realtime.subscribe/emit`, canaux `conversation:{id}`, `user:{id}`, `presence`) + hook `useRealtime`.
  Mock = bus mémoire ; API = WebSocket (`NEXT_PUBLIC_WS_URL`). Les services mock émettent des événements lorsqu'ils mutent un état.
- **Panier par utilisateur** : `cart.store` (`owner`, `carts`, fusion invité → compte dans `CartOwnerSync`).
- **Pré-rendu** : les pages `[id]` exportent `generateStaticParams` (mode mock) pour éviter les démarrages à froid.

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
