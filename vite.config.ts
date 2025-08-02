import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    // Only include Replit-specific plugins in development on Replit
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          // Runtime error overlay
          await import("@replit/vite-plugin-runtime-error-modal").then((m) => m.default()),
          // Cartographer plugin
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    target: "es2020",
    minify: "esbuild",
    sourcemap: process.env.NODE_ENV !== "production",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React dependencies
          if (id.includes("react") || id.includes("react-dom")) {
            return "react-vendor";
          }
          // Conversion optimization components
          if (id.includes("/components/ConversionHero") || 
              id.includes("/components/InteractiveCTA") || 
              id.includes("/components/TrustSignals") || 
              id.includes("/components/UrgencyIndicators") ||
              id.includes("/components/StickyMicroCTA") ||
              id.includes("/components/CTABand")) {
            return "conversion-components";
          }
          // Analytics and tracking
          if (id.includes("/hooks/useConversionTracking") ||
              id.includes("/lib/analytics") ||
              id.includes("/types/analytics") ||
              id.includes("/types/conversion")) {
            return "analytics";
          }
          // UI Library components
          if (id.includes("@radix-ui/") || id.includes("/components/ui/")) {
            return "ui-library";
          }
          // Utility libraries
          if (id.includes("clsx") || 
              id.includes("tailwind-merge") || 
              id.includes("date-fns") ||
              id.includes("framer-motion")) {
            return "utilities";
          }
          // Query and state management
          if (id.includes("@tanstack/react-query") || 
              id.includes("wouter") ||
              id.includes("zustand")) {
            return "state-management";
          }
          // Firebase and authentication
          if (id.includes("firebase") || id.includes("auth")) {
            return "firebase";
          }
          // Default vendor chunk for other node_modules
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".") || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
      },
      // Optimize for conversion components
      external: [],
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      }
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096,
    // Enable CSS code splitting for better caching
    cssCodeSplit: true,
    // Optimize for Railway deployment
    reportCompressedSize: process.env.NODE_ENV !== "production",
    // Enable build caching for faster rebuilds
    write: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
