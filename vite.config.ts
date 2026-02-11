import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  server: {
    host: true,
    port: 5040,
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          // TipTap editor
          if (id.includes('node_modules/@tiptap/') ||
              id.includes('node_modules/prosemirror') ||
              id.includes('node_modules/@prosemirror')) {
            return 'tiptap-vendor';
          }
          // AI service SDKs
          if (id.includes('node_modules/openai') ||
              id.includes('node_modules/@google/generative-ai')) {
            return 'ai-vendor';
          }
          // Markdown rendering
          if (id.includes('node_modules/react-markdown') ||
              id.includes('node_modules/react-syntax-highlighter') ||
              id.includes('node_modules/remark') ||
              id.includes('node_modules/rehype') ||
              id.includes('node_modules/unified') ||
              id.includes('node_modules/mdast') ||
              id.includes('node_modules/micromark') ||
              id.includes('node_modules/hast')) {
            return 'markdown-vendor';
          }
          // UI libraries
          if (id.includes('node_modules/framer-motion')) {
            return 'ui-vendor';
          }
        },
      },
    },
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },

  publicDir: 'public',
});
