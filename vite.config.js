import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import livePreview from "vite-live-preview";
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  plugins: [
    react(),
    livePreview({
      reload: true,
    }),
    nodePolyfills({ include: ['stream', 'util'] }),
  ],
  define: {
    'import.meta.env.VITE_STANDALONE_MODE': JSON.stringify(process.env.VITE_STANDALONE_MODE || 'false'),
  },
  build: {
    emptyOutDir: false,
  },
  server: {
    port: 5174,
    cors: true,
  },
  preview: {
    port: 5174,
    cors: true,
  },
})
