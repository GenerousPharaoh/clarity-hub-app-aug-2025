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
          // TipTap editor (lazy-loaded with editor tab)
          if (id.includes('node_modules/@tiptap/') ||
              id.includes('node_modules/prosemirror') ||
              id.includes('node_modules/@prosemirror')) {
            return 'tiptap-vendor';
          }
          // Markdown rendering (lazy-loaded with AI chat)
          if (id.includes('node_modules/react-markdown') ||
              id.includes('node_modules/remark') ||
              id.includes('node_modules/rehype') ||
              id.includes('node_modules/unified') ||
              id.includes('node_modules/mdast') ||
              id.includes('node_modules/micromark') ||
              id.includes('node_modules/hast')) {
            return 'markdown-vendor';
          }
          // Syntax highlighting (separated from markdown for better caching)
          if (id.includes('node_modules/react-syntax-highlighter') ||
              id.includes('node_modules/refractor') ||
              id.includes('node_modules/prismjs')) {
            return 'syntax-vendor';
          }
          // PDF export (dynamically imported, only loaded on export)
          if (id.includes('node_modules/jspdf') ||
              id.includes('node_modules/html2canvas')) {
            return 'pdf-export';
          }
          // DOCX export (dynamically imported)
          if (id.includes('node_modules/docx')) {
            return 'docx-export';
          }
          // Supabase client
          if (id.includes('node_modules/@supabase')) {
            return 'supabase-vendor';
          }
          // TanStack Query
          if (id.includes('node_modules/@tanstack')) {
            return 'query-vendor';
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
