import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
// https://vite.dev/config/
export default ({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    // Use dynamic port configuration:
    // 1. Use VITE_DEV_PORT from env if set
    // 2. Otherwise, let Vite choose an available port
    const devPort = env.VITE_DEV_PORT ? parseInt(env.VITE_DEV_PORT, 10) : undefined;
    
    // Check if we're in debug mode
    const useTestApp = env.VITE_USE_TEST_APP === 'true';
    
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
        // Use the test entry point if in test mode
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
        // Configure server settings with dynamic port
        server: {
            host: 'localhost',
            port: devPort, // Use the port from env or let Vite choose
            strictPort: false, // Allow using alternative port if specified one is in use
            open: true,
            hmr: {
                host: 'localhost', // force exact host
                clientPort: devPort, // use dynamic port or let Vite determine
                protocol: 'ws', // stay on ws in http dev
            },
        },
        // Add customized build configuration
        // Define environment variables
        define: {
            'import.meta.env.APP_VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0'),
            '__APP_DEBUG__': JSON.stringify(env.VITE_DEV_DEBUG === 'true'),
        },
        // Optimized dependencies
        optimizeDeps: {
            include: ['react', 'react-dom', 'react-router-dom', '@mui/material'],
        },
    });
};
