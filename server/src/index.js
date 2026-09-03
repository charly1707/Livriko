import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const distDir = path.resolve(rootDir, 'dist');

// Charger .env AVANT Cloudinary / routes (sinon api_key manquant → 503 upload)
dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

await import('./config/sanitizeEnv.js');
const { configureCloudinary } = await import('./config/cloudinary.js');
configureCloudinary();

const express = (await import('express')).default;
const session = (await import('express-session')).default;
const MongoStore = (await import('connect-mongo')).default;
const mongoose = (await import('mongoose')).default;
const cors = (await import('cors')).default;
const morgan = (await import('morgan')).default;
const { createApiRouter } = await import('./routes.js');

const PORT = Number(process.env.PORT || 4000);
const MONGODB_URI = process.env.MONGODB_URI;
const isProduction = process.env.NODE_ENV === 'production';

if (!MONGODB_URI) {
  console.error('MONGODB_URI est manquant. Ajoutez-le dans les variables d’environnement Render.');
  process.exit(1);
}

async function start() {
  await mongoose.connect(MONGODB_URI);
  console.log(`MongoDB connecté (${mongoose.connection.name})`);

  const app = express();
  app.set('trust proxy', 1);

  const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, true);
    },
    credentials: true,
  }));

  app.use(morgan(isProduction ? 'combined' : 'dev'));
  app.use(express.json({
    limit: '2mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  }));
  app.use(express.urlencoded({ extended: true }));

  app.use(session({
    name: 'livriko.sid',
    secret: process.env.SESSION_SECRET || 'livriko-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      client: mongoose.connection.getClient(),
      collectionName: 'sessions',
    }),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }));

  app.use('/backend/uploads', express.static(path.resolve(__dirname, '../uploads')));
  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

  const apiRouter = createApiRouter();
  app.use('/backend/index.php/api', apiRouter);
  app.use('/api', apiRouter);

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development',
    });
  });

  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (
        req.path.startsWith('/api')
        || req.path.startsWith('/backend')
        || req.path.startsWith('/health')
        || req.path.startsWith('/uploads')
      ) {
        return next();
      }
      return res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ success: false, message: 'Une erreur interne est survenue.' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Livriko en ligne sur le port ${PORT}${fs.existsSync(distDir) ? ' (API + frontend)' : ' (API seulement)'}`);
  });
}

start().catch((error) => {
  console.error('Impossible de démarrer le serveur:', error);
  process.exit(1);
});
