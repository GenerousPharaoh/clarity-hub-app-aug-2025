import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
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
    
    // Configure server settings with more flexible port handling
    server: {
      host: 'localhost',
      port: 5175, // Updated port from 5173 to 5175
      strictPort: false,
      open: true,
      hmr: {
        protocol: "ws",
        host: "localhost",
        port: 5175, // Match HMR port with server port
        overlay: true, // Show errors as overlay
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
