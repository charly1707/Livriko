import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import { createApiRouter } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = Number(process.env.PORT || 4000);
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI est manquant. Ajoutez-le dans le fichier .env');
  process.exit(1);
}

const uploadsDir = path.resolve(__dirname, '../uploads');
fs.mkdirSync(path.join(uploadsDir, 'products'), { recursive: true });
fs.mkdirSync(path.join(uploadsDir, 'chat'), { recursive: true });

async function start() {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connecté');

  const app = express();
  app.set('trust proxy', 1);

  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
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
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }));

  app.use('/backend/uploads', express.static(uploadsDir));
  app.use('/uploads', express.static(uploadsDir));

  const apiRouter = createApiRouter();
  app.use('/backend/index.php/api', apiRouter);
  app.use('/api', apiRouter);

  app.get('/health', (_req, res) => {
    res.json({ ok: true, database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ success: false, message: 'Une erreur interne est survenue.' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API Livriko (Node + MongoDB) sur http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Impossible de démarrer le serveur:', error);
  process.exit(1);
});
