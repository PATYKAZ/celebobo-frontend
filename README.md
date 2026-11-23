# Celebobo — frontend

Boutique et back-office de Celebobo (Next.js 16, Tailwind 4), branchés sur l'API Django du dépôt `celebobo`.

```bash
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

| Document | Contenu |
|---|---|
| [docs/CONVENTIONS.md](docs/CONVENTIONS.md) | Démarrage, architecture, règles de code, design, mobile, contrôles |
| [docs/RENDERING.md](docs/RENDERING.md) | Pages statiques, cache, revalidation par Django, variables du conteneur |
| [docs/INTEGRATION_STATUS.md](docs/INTEGRATION_STATUS.md) | Fonctions de l'API encore sans écran, demandes ouvertes |

Les règles métier (commandes, points, garanties, revendeurs…) sont dans `docs/business/` du dépôt backend.
