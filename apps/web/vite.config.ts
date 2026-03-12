import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@beacon/types': path.resolve(__dirname, '../../packages/types/src'),
      '@beacon/api-client': path.resolve(__dirname, '../../packages/api-client/src'),
      '@beacon/sdk': path.resolve(__dirname, '../../packages/sdk/src'),
      '@': path.resolve(__dirname, './src'),
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },

  server: {
    port: 5173,
    host: true,
    strictPort: true,
    hmr: {
      overlay: true,
    },
    proxy: {
      '/api/moderation': {
        target: process.env.VITE_MODERATION_API || 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api/media': {
        target: process.env.VITE_MEDIA_API || 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:4000',
        changeOrigin: true,
        timeout: 10000,
      },
      '/gateway': {
        target: process.env.VITE_GATEWAY_URL || 'ws://localhost:4001',
        ws: true,
      }
    }
  },

  preview: {
    port: 4173,
    host: true,
  },

  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    reportCompressedSize: true,
    
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor';
          }
          if (id.includes('node_modules/zustand')) {
            return 'state-vendor';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'ui-vendor';
          }
          if (id.includes('node_modules/react-virtuoso')) {
            return 'list-vendor';
          }
          if (id.includes('/pages/ServerSettings')) {
            return 'page-server-settings';
          }
          if (id.includes('/pages/Shop') || id.includes('/stores/useShopStore')) {
            return 'page-shop';
          }
          if (id.includes('/pages/Quests') || id.includes('/stores/useQuestStore')) {
            return 'page-quests';
          }
          if (id.includes('/components/settings')) {
            return 'settings-components';
          }
          if (id.includes('/components/modals')) {
            return 'modal-components';
          }
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'framer-motion',
      'lucide-react',
    ],
    exclude: ['@beacon/types', '@beacon/api-client', '@beacon/sdk'],
  },

  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    legalComments: 'none',
    treeShaking: true,
  },

  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
