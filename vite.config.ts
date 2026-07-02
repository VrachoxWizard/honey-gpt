import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { localApiPlugin } from './dev/localApiPlugin.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    resolve: {
      alias: {
        '@shared': path.resolve(process.cwd(), './shared'),
        '@': path.resolve(process.cwd(), './src'),
        '@components': path.resolve(process.cwd(), './src/components'),
        '@hooks': path.resolve(process.cwd(), './src/hooks'),
        '@store': path.resolve(process.cwd(), './src/store'),
        '@lib': path.resolve(process.cwd(), './src/lib'),
        '@utils': path.resolve(process.cwd(), './src/utils'),
        '@styles': path.resolve(process.cwd(), './src/styles'),
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      localApiPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'Haničar GPT',
          short_name: 'Haničar',
          description: 'Hrvatski satirični AI chatbot',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'hanicar-the-genie.jpeg',
              sizes: '192x192',
              type: 'image/jpeg',
            },
            {
              src: 'hanicar-the-genie.jpeg',
              sizes: '512x512',
              type: 'image/jpeg',
            },
          ],
        },
      }),
    ],
    server: {
      host: '127.0.0.1',
      port: 5173,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || id.includes('react/')) {
                return 'vendor-react';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-motion';
              }
              if (
                id.includes('react-markdown') ||
                id.includes('remark-gfm') ||
                id.includes('unist') ||
                id.includes('mdast') ||
                id.includes('micromark')
              ) {
                return 'vendor-markdown';
              }
            }
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      environmentMatchGlobs: [
        ['server/**', 'node'],
        ['api/**', 'node'],
        ['shared/**', 'node'],
        ['dev/**', 'node'],
      ],
      globals: true,
      setupFiles: './src/setupTests.ts',
      exclude: ['**/node_modules/**', '**/e2e/**'],
      coverage: {
        provider: 'v8',
        include: [
          'server/**/*.ts',
          'api/**/*.ts',
          'shared/**/*.ts',
          'src/lib/**/*.ts',
          'src/store/**/*.ts',
          'src/hooks/**/*.ts',
        ],
        exclude: ['**/*.test.ts', '**/*.d.ts'],
        thresholds: {
          lines: 60,
          functions: 60,
          statements: 60,
          branches: 45,
        },
      },
    },
  };
});
