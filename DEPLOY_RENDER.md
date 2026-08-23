# Déploiement Livriko sur Render

## Architecture

Un seul **Web Service Render** sert :
- le frontend React (dossier `dist/` après `npm run build`)
- l’API Node.js Express (`/api` et `/backend/index.php/api`)

## 1. Pousser le code sur GitHub

Le dépôt cible : https://github.com/charly1707/Livriko

## 2. Créer le service sur Render

1. Allez sur [render.com](https://render.com) → **New +** → **Blueprint** (recommandé) ou **Web Service**
2. Connectez le repo `charly1707/Livriko`
3. Si vous utilisez le Blueprint, Render lit `render.yaml` automatiquement
4. Sinon, configurez manuellement :
   - **Runtime** : Node
   - **Build Command** : `npm install --include=dev && npm run build`
   - **Start Command** : `npm start`
   - **Health Check Path** : `/health`

## 3. Variables d’environnement (Render Dashboard)

| Variable | Obligatoire | Description |
|---|---|---|
| `NODE_ENV` | oui | `production` |
| `MONGODB_URI` | oui | URI MongoDB Atlas (`.../livriko?...`) |
| `SESSION_SECRET` | oui | Chaîne aléatoire longue (Render peut la générer) |
| `CLOUDINARY_CLOUD_NAME` | oui | ex. `dj7pgv8l` |
| `CLOUDINARY_API_KEY` | oui | Clé API Cloudinary |
| `CLOUDINARY_API_SECRET` | oui | Secret Cloudinary |
| `MAPS_API_URL` | non | `https://router.project-osrm.org` |
| `PAYMENT_CURRENCY` | non | `XOF` |

Ne commitez jamais `.env` sur GitHub.

## 4. MongoDB Atlas

Dans Atlas → **Network Access**, autorisez les IP Render :
- soit `0.0.0.0/0` (simple pour démarrer)
- soit les IP sortantes de votre service Render (plus sécurisé)

## 5. Vérification

Après déploiement :
- `https://VOTRE-SERVICE.onrender.com/health` → `{ "ok": true }`
- Ouvrez l’URL principale → l’app React doit s’afficher
- Testez inscription / connexion / upload image

## Commandes locales

```bash
npm install
npm run build
NODE_ENV=production npm start
```

L’app locale sera sur http://localhost:4000 (API + frontend buildé).
