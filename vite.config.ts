import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  tanstackStart: {
    server: {
      entry: "./server.ts",
    },
  },

  vite: {
    build: {
      chunkSizeWarningLimit: 1000,
    },

    // ✅ Fix dependency scan issues
    optimizeDeps: {
      include: ["sonner", "recharts", "pdfjs-dist"],
    },

    // ✅ Fix SSR issues (VERY IMPORTANT for pdfjs)
    ssr: {
      noExternal: ["pdfjs-dist"],
    },
  },
});