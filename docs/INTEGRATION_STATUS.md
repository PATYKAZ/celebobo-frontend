# État de l'intégration API ↔ front

Mis à jour le 23 nov. 2026, en comparant les endpoints déclarés dans `src/config/endpoints.ts` aux appels faits par
les modules.

**Chaque fonction de l'API a son écran.**

- **Boutique** : catalogue avec compteurs des filtres (`/products/facets/`), fiche, panier, commande, suivi,
  messagerie, notifications, assistant, Cagnotte.
- **Compte** : commandes, points, avoir, réclamations, données personnelles, consentements.
- **Back-office** :
  - catalogue : tableau de bord, analytique, produits, catégories, offres du jour, codes promo, accueil, bannières,
    pages, FAQ, alertes de stock, avis ;
  - activité : commandes, réclamations, ventes, messages, messages de contact, newsletter, assistant (journal et
    réindexation), mes exports ;
  - équipe : revendeurs, candidatures, commissions, encaissements, Cagnotte, niveaux et sanctions ;
  - système : utilisateurs (création, modification, lien de mot de passe, présence en ligne), audit (modifications et
    événements métier), fidélité, réglages (dont les zones de livraison).

Aucune demande n'est ouverte côté API : l'offre du jour renvoie `variant_id` depuis le 23 nov. 2026.

## Refaire la mesure

Avec la pile locale lancée : `./deploy/local.sh exec -T api python manage.py spectacular --format openapi-json`
donne le schéma à comparer avec `src/config/endpoints.ts` et les services des modules.
