import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        parserOpts: {
          plugins: ['decorators-legacy', 'classProperties']
        }
      }
    }),
    // Add PWA plugin with proper configuration for favicon caching
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        '*.png',
        'logo.svg'
      ],
      manifest: {
        name: 'Clarity Hub',
        short_name: 'Clarity',
        description: 'Document management and analysis platform',
        theme_color: '#1976d2',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Use runtime caching for favicon.ico and other assets
        runtimeCaching: [
          {
            urlPattern: /\.(?:ico|png|svg|jpg|jpeg|gif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets'
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ],
  
  // Ensure proper resolution of TinyMCE resources
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'tinymce': resolve(__dirname, 'public/tinymce'),
    }
  },
  
  server: {
    host: true,
    port: 5040,
    // Add proper CORS headers for development
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  
  // Disable TypeScript type checking in build
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    tsconfigRaw: {
      compilerOptions: {
        useDefineForClassFields: false
      }
    }
  },
  
  // Add customized build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimize chunks
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'pdf-vendor': ['react-pdf'],
        },
      },
    },
    // Ensure service worker is copied to dist
    assetsDir: 'assets',
    emptyOutDir: true,
  },
  
  // Handle PWA configuration
  define: {
    'import.meta.env.APP_VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
  
  // Optimized dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@mui/material'],
  },
  
  // Configure worker handling
  worker: {
    format: 'es',
  },
  
  // Copy the PDF.js worker files to the public directory during build
  publicDir: 'public',
});
