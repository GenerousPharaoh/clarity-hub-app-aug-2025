import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Always use port 5173 and override any env setting to avoid conflicts
  const devPort = 5173;
  
  return defineConfig({
    plugins: [react()],
    
    // Ensure proper resolution of TinyMCE resources
    resolve: {
      alias: {
        // Alias for TinyMCE resources
        tinymce: resolve(__dirname, 'node_modules/tinymce'),
        '@': resolve(__dirname, 'src'),
      }
    },
    
    // Configure server settings with fixed port
    server: {
      host: 'localhost',
      port: devPort,
      strictPort: true, // Force this port, don't try alternatives
      open: true,
      hmr: {
        host: 'localhost',       // force exact host
        clientPort: devPort,     // ensure matching port
        protocol: 'ws',          // stay on ws in http dev
      },
    },
    
    // Add customized build configuration
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      // Optimize chunks
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@mui/material', '@mui/icons-material'],
            editor: ['tinymce'],
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
  });
}
