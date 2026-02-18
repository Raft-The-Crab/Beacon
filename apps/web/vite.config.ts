import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      // Automatic JSX runtime
      jsxRuntime: 'automatic',
    }),
  ],

  resolve: {
    alias: {
      '@beacon/types': path.resolve(__dirname, '../../packages/types/src'),
      '@beacon/api-client': path.resolve(__dirname, '../../packages/api-client/src'),
      '@beacon/sdk': path.resolve(__dirname, '../../packages/sdk/src'),
      '@': path.resolve(__dirname, './src'),
      // Force single React instance to prevent hook errors
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
  },

  preview: {
    port: 4173,
    host: true,
  },

  build: {
    // Production optimizations
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',

    // Enable minification
    minify: 'esbuild',

    // Code splitting optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor splitting
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'state-vendor': ['zustand'],
          'ui-vendor': ['lucide-react'],
        },
        // Optimize chunk names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },

    // Source maps for production debugging
    sourcemap: false,

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // Asset inlining threshold
    assetsInlineLimit: 4096,

    // CSS code splitting
    cssCodeSplit: true,

    // Enable reporting
    reportCompressedSize: true,

    // Enable tree-shaking
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'lucide-react',
    ],
  },

  // Performance
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    legalComments: 'none',
    treeShaking: true,
  },

  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
