import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createApp } from './server/app.ts';

function resolvePort(): number {
  const portFlagIndex = process.argv.indexOf('--port');
  const cliPort = portFlagIndex !== -1 ? process.argv[portFlagIndex + 1] : undefined;
  const parsed = parseInt(cliPort || process.env.PORT || '3000', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3000;
}

async function startServer() {
  const app = createApp();
  const PORT = resolvePort();
  const ROOT = process.cwd();
  const PUBLIC_DIR = path.join(ROOT, 'public');

  app.use((req, res, next) => {
    if (req.path === '/admin' || req.path.startsWith('/admin/') || req.path.startsWith('/api/')) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    next();
  });

  // Serve static public uploads & official brand assets directly in local/node server
  app.use('/uploads', express.static(path.join(PUBLIC_DIR, 'uploads'), { maxAge: '1d' }));
  app.use('/assets', express.static(path.join(PUBLIC_DIR, 'assets'), { maxAge: '7d' }));

  const logoPegPath = path.join(PUBLIC_DIR, 'logo.peg');
  app.get('/logo.peg', (_req, res, next) => {
    if (fs.existsSync(logoPegPath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      return res.sendFile(logoPegPath);
    }
    return next();
  });

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(ROOT, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SPES] Swiftpace Engineering Solutions server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SPES] Failed to start server:', err);
  process.exit(1);
});
