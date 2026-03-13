import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

function normalizeProxyTarget(rawValue: string | undefined, fallback: string): string {
  const value = rawValue?.trim()

  if (!value || value.startsWith('/')) {
    return fallback
  }

  if (value.startsWith('ws://')) {
    return `http://${value.slice('ws://'.length)}`
  }

  if (value.startsWith('wss://')) {
    return `https://${value.slice('wss://'.length)}`
  }

  return value
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = normalizeProxyTarget(env.VITE_BACKEND_URL, 'http://localhost:8080')
  const gatewayProxyTarget = normalizeProxyTarget(env.VITE_GATEWAY_URL, 'http://localhost:4001')

  return {
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
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'beacon.qzz.io',
      'www.beacon.qzz.io',
      '.devtunnels.ms',
      '.asse.devtunnels.ms',
    ],
    strictPort: true,
    hmr: {
      overlay: true,
    },
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        timeout: 10000,
      },
      '/gateway': {
        target: gatewayProxyTarget,
        ws: true,
        changeOrigin: true,
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
          if (id.includes('/pages/Quests') || id.includes('/stores/useQuestStore')) {
            return 'page-quests';
          }
          if (id.includes('/components/settings')) {
            return 'settings-components';
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
    global: 'globalThis',
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
}
})
