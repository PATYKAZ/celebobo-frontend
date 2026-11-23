# État de l'intégration API ↔ front

Mis à jour le 23 nov. 2026 (fin de la phase 7 du plan d'implémentation), en comparant les endpoints déclarés dans
`src/config/endpoints.ts` aux appels faits par les modules.

**Tout ce qui existe à l'écran est branché** : boutique, compte (points, avoir, réclamations, données, consentements),
panier, commande, suivi, messagerie, notifications, assistant, et le back-office — tableau de bord, analytique,
produits, catégories, offres du jour, codes promo, accueil, bannières, pages, FAQ, alertes de stock, avis, commandes,
réclamations, ventes, messages, messages de contact, newsletter, revendeurs, candidatures, commissions, encaissements,
Cagnotte, niveaux et sanctions, utilisateurs, audit, fidélité, réglages (dont les zones de livraison).

## Fonctions de l'API encore sans écran

| Fonction | Endpoints | Qui | Idée d'écran |
|---|---|---|---|
| Journal de l'assistant, réindexation du catalogue | `GET /bo/assistant/logs/`, `POST /bo/embeddings/reindex/` | responsable / admin | `/admin/assistant` : questions posées (coût, sujet), bouton « Reconstruire l'index » |
| Historique des exports et imports | `GET /jobs/`, `GET /jobs/{id}/download/` | revendeur + | Liste « Mes exports » et re-téléchargement (7 jours) ; aujourd'hui seul le téléchargement immédiat existe |
| Créer un compte d'équipe, modifier un utilisateur, lui envoyer un lien de réinitialisation | `POST /bo/users/`, `PATCH /bo/users/{id}/`, `POST /bo/users/{id}/send-password-reset/` | admin | Actions sur l'écran Utilisateurs, qui ne change aujourd'hui que le rôle et l'activation (les comptes revendeur se créent depuis l'écran Revendeurs) |
| Journal des événements métier | `GET /bo/audit-logs/events/` | admin | Onglet de l'écran Audit, à côté des modifications de données |
| Présence en ligne | `GET /bo/presence/` | responsable | Qui est connecté maintenant (la disponibilité déclarée et le canal temps réel `presence` sont déjà utilisés) |
| Compteurs des filtres de la boutique | `GET /products/facets/` | tous | Nombre de produits par catégorie, prix min/max, en stock, en promo |

## Demandes encore ouvertes côté API

- **Offre du jour sur une variante** : `GET /home/` (`deal`) ne renvoie pas `variant_id` ; le front retrouve la
  variante en offre par son prix (`home.mapper.ts`), ce qui échoue si deux variantes ont le même prix.

## Refaire la mesure

Avec la pile locale lancée : `./deploy/local.sh exec -T api python manage.py spectacular --format openapi-json`
donne le schéma à comparer avec `src/config/endpoints.ts` et les services des modules.
