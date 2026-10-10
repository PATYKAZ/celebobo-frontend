# État de l'intégration API ↔ front

Mesuré le 10 oct. 2026 sur la stack locale (`./deploy/local.sh` du dépôt backend), en comparant le schéma
OpenAPI de l'API (163 chemins, 204 opérations) aux appels réellement faits par le code du front.

**Tout ce qui existe à l'écran est branché** : boutique, compte, panier, commande, suivi, messagerie,
notifications, assistant, et le back-office (tableau de bord, analytique, produits, catégories, commandes,
ventes, commissions, revendeurs, utilisateurs, audit, espace revendeur). Test navigateur sans aucune erreur API
pour un client, un admin et un revendeur, WebSocket compris.

Ce qui reste concerne des **fonctions de l'API sans écran** : à créer côté front.

## 1. Écrans back-office à créer

| Écran (proposé) | Endpoints | Qui | Ce qu'il permet |
|---|---|---|---|
| `/admin/parametres` — Réglages du site | `GET/PATCH /bo/settings/` | admin | Hotline, WhatsApp, e-mail, adresse, horaires, moyens de paiement proposés, réseaux sociaux, taux USD→CDF, code et remise newsletter |
| `/admin/contenu/bannieres` | `GET/POST /bo/banners/`, `PATCH/DELETE /bo/banners/{id}/` | responsable | Bannières de l'accueil (image, lien, ordre, dates de diffusion) |
| `/admin/contenu/pages` | `GET/POST /bo/pages/`, `PATCH/DELETE /bo/pages/{id}/` | responsable | Pages CMS (à propos, guide, conditions, retours…) |
| `/admin/contenu/faq` | `GET/POST /bo/faq/`, `PATCH/DELETE /bo/faq/{id}/` | responsable | Questions fréquentes par catégorie |
| `/admin/codes-promo` | `GET/POST /bo/coupons/`, `GET/PATCH/DELETE /bo/coupons/{id}/` | responsable | Codes promo : % ou montant, plafond, minimum, dates, limites d'utilisation, livraison offerte |
| `/admin/livraison` | `GET/POST /bo/shipping-zones/`, `PATCH/DELETE /bo/shipping-zones/{id}/` | responsable | Zones de livraison : villes, frais, seuil de gratuité, délai, zone par défaut |
| `/admin/candidatures` | `GET /bo/reseller-applications/` (+ `/{id}/`), `POST …/{id}/approve/`, `POST …/{id}/reject/` | responsable | Examiner les demandes « Devenir revendeur » : valider (taux, responsable) ou refuser (motif) |
| `/admin/contact` | `GET /bo/contact-messages/`, `GET/PATCH /bo/contact-messages/{id}/` | responsable | Boîte des messages du formulaire de contact : traité / spam, note interne |
| `/admin/newsletter` | `GET /bo/newsletter/subscribers/`, `GET …/export/` (CSV) | responsable | Abonnés (actifs / désinscrits, recherche) et export |
| `/admin/avis` | `GET /bo/reviews/`, `PATCH /bo/reviews/{id}/` | responsable | Modération des avis : masquer / republier (la fiche produit admin ne fait que les lister) |
| `/admin/assistant` | `GET /bo/assistant/logs/`, `POST /bo/embeddings/reindex/` | responsable / admin | Journal des questions (coût, sentiment, sujet) et reconstruction de l'index produits |
| `/admin/stock` (ou bloc du tableau de bord) | `GET /bo/stock/alerts/` | responsable | Produits et variantes sous le seuil d'alerte (l'événement temps réel `stock.low` existe déjà) |
| `/admin/exports` | `GET /jobs/`, `GET /jobs/{id}/download/` | revendeur + | Historique de mes exports / imports et re-téléchargement (7 jours) |

## 2. Compléments sur des écrans existants

| Écran | Manque | Endpoint |
|---|---|---|
| Utilisateurs | Créer un compte (l'utilisateur reçoit une invitation), modifier nom / e-mail / téléphone, envoyer un lien de réinitialisation | `POST /bo/users/`, `PATCH /bo/users/{id}/`, `POST /bo/users/{id}/send-password-reset/` |
| Commissions | Le détail des écritures (gagné / annulé par vente) d'un revendeur | `GET /bo/commissions/?reseller_id=` |
| Audit | Le journal des événements métier (commande passée, rôle changé…) à côté des modifications de données ; détail d'une entrée | `GET /bo/audit-logs/events/`, `GET /bo/audit-logs/{id}/` |
| Commandes / assignation | Qui est connecté maintenant (en plus de la disponibilité déclarée) | `GET /bo/presence/` |
| Liste produits (boutique) | Compteurs des filtres (nombre par catégorie, prix min/max, en stock, en promo) | `GET /products/facets/` |
| Inscription | Vérifier le code revendeur pendant la saisie (« Code de Grace ✓ ») | `GET /auth/referral-codes/{code}/validate/` |

## 3. Nettoyage

- `ENDPOINTS.orderActions.cancel` (`/orders/{id}/cancel/`) n'existe pas dans l'API : l'annulation passe par
  `/me/orders/{number}/cancel/` (déjà utilisée). L'entrée peut être supprimée.
- `ENDPOINTS.admin.products.restore` n'est pas appelé : la restauration passe par l'action groupée `restore`.

## Refaire la mesure

Avec la stack locale lancée : `./deploy/local.sh exec -T api python manage.py spectacular --format openapi-json`
donne le schéma à comparer avec `src/config/endpoints.ts` et les services des modules.
