import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Remove internal workspace artifacts and unreferenced raw photo dumps from dist/ after Vite copies public/,
 * without modifying or deleting any original source files in public/.
 */
function pruneUnpublishedDistAssets(): Plugin {
  return {
    name: 'prune-unpublished-dist-assets',
    closeBundle() {
      const distAssetsDir = path.resolve(import.meta.dirname, 'dist', 'assets');
      const pruneTargets = [
        path.join(distAssetsDir, 'aistudio'),
        path.join(distAssetsDir, 'projects', 'Project Images')
      ];
      for (const target of pruneTargets) {
        if (fs.existsSync(target)) {
          fs.rmSync(target, { recursive: true, force: true });
        }
      }
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), pruneUnpublishedDistAssets()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
