import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import { createApi } from './routes/api.js';
import { errorHandler, notFound } from './middleware/errors.js';

export function createApp(config) {
  const app = express();
  const uploadsPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'uploads');
  fs.mkdirSync(uploadsPath, { recursive: true });
  if (config.trustProxy) app.set('trust proxy', config.trustProxy);
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));
  const configuredOrigins = config.clientUrl.split(',').map((origin) => origin.trim()).filter(Boolean);
  app.use(cors({
    origin(origin, callback) {
      const localDevelopmentOrigin = config.nodeEnv !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
      callback(null, !origin || configuredOrigins.includes(origin) || localDevelopmentOrigin);
    },
    credentials: true
  }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/uploads/:filename', async (req, res, next) => {
    try {
      const filename = path.basename(req.params.filename);
      const localFile = path.join(uploadsPath, filename);
      if (fs.existsSync(localFile)) {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.sendFile(localFile);
      }
      const db = mongoose.connection.db;
      if (!db) return next();
      const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
      const files = await bucket.find({ filename }).toArray();
      if (!files.length) return next();
      const file = files[0];
      res.setHeader('Content-Type', file.contentType || 'image/jpeg');
      res.setHeader('Content-Length', file.length);
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      bucket.openDownloadStreamByName(filename).pipe(res);
    } catch (err) {
      next(err);
    }
  });

  app.use('/uploads', express.static(uploadsPath, {
    maxAge: '1d',
    setHeaders(res) {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }));
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: config.nodeEnv === 'production' ? 30 : 100, standardHeaders: 'draft-7', legacyHeaders: false, skip: (req) => req.path === '/me' || req.path === '/logout', message: { success: false, message: 'Too many sign-in attempts. Please wait a few minutes before trying again.' } });
  app.use('/api/auth', authLimiter);
  app.use('/api', createApi(config));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
