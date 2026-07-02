import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
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
    plugins: [react(), tailwindcss(), localApiPlugin()],
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
          lines: 55,
          functions: 55,
          statements: 55,
          branches: 45,
        },
      },
    },
  };
});
