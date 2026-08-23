# Livriko — marketplace & livraison (Lokossa)

Plateforme marketplace et livraison rapide avec React, Node.js, MongoDB Atlas et Cloudinary.

## Stack

- **Frontend** : React 19, Vite, Tailwind CSS
- **Backend** : Node.js, Express, Mongoose
- **Base** : MongoDB Atlas
- **Images** : Cloudinary

## Démarrage local

```bash
npm install
cp .env.example .env   # puis remplissez MONGODB_URI, CLOUDINARY_*, etc.

# Terminal 1 — API
npm run dev:server

# Terminal 2 — Frontend
npm run dev
```

## Déploiement Render

Voir [DEPLOY_RENDER.md](./DEPLOY_RENDER.md) pour le guide complet.

Résumé :
- Build : `npm install --include=dev && npm run build`
- Start : `npm start`
- Health : `/health`

