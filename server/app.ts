import cookieParser from 'cookie-parser';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { isAllowedOrigin } from './middleware/auth.ts';
import adminRoutes from './routes/admin.ts';
import publicRoutes from './routes/public.ts';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  const trustProxyHops = parseInt(process.env.TRUST_PROXY_HOPS || '2', 10);
  app.set('trust proxy', Number.isFinite(trustProxyHops) ? trustProxyHops : 2);

  // Security headers compatible with Netlify CDN & embedded preview
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // Origin-allowlisted CORS
  app.use((req, res, next) => {
    const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
    if (origin && isAllowedOrigin(origin, req)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }
    }
    return next();
  });

  // 6 MB ceiling aligned with Netlify Functions synchronous request payload limit
  app.use(express.json({ limit: '6mb' }));
  app.use(express.urlencoded({ extended: true, limit: '6mb' }));
  app.use(cookieParser());

  // Public & Admin API routes
  app.use('/api/admin', adminRoutes);
  app.use('/api', publicRoutes);

  // Unmatched /api/* endpoints always return JSON
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Structured JSON error handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    if (err?.type === 'entity.too.large' || err?.status === 413) {
      return res.status(413).json({
        error: 'Payload exceeds the 4 MB per-file upload limit. Please compress or resize your image.'
      });
    }

    const status =
      typeof err?.status === 'number'
        ? err.status
        : typeof err?.statusCode === 'number'
          ? err.statusCode
          : 500;

    if (req.path.startsWith('/api')) {
      console.error('[SPES API Error]', err);
      return res.status(status).json({ error: err?.message || 'An unexpected server error occurred.' });
    }
    return res.status(status).json({ error: err?.message || 'Server error.' });
  });

  return app;
}
