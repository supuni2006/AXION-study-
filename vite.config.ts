import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
  ],

  tanstackStart: {
    server: {
      entry: "./server.ts",
    },
  },

  vite: {
    build: {
      chunkSizeWarningLimit: 1000,
    },
  },
});