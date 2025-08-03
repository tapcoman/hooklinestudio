import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  return {
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react'
    }),
    // Only include Replit-specific plugins in development on Replit
    ...(mode !== "production" &&
    process.env['REPL_ID'] !== undefined
      ? [
          // Runtime error overlay
          (await import("@replit/vite-plugin-runtime-error-modal")).default(),
          // Cartographer plugin
          (await import("@replit/vite-plugin-cartographer")).cartographer(),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Force cache invalidation
    assetsDir: `assets`,
    target: "es2020",
    minify: "esbuild",
    sourcemap: process.env['NODE_ENV'] !== "production",
    rollupOptions: {
      external: [],
      output: {
        format: 'es',
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-slot', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'utils-vendor': ['clsx', 'tailwind-merge', 'lucide-react']
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".") || [];
          const ext = info[info.length - 1] || "";
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: "assets/js/[name]-[hash]-v2025.08.03.003.js",
        entryFileNames: "assets/js/[name]-[hash]-v2025.08.03.003.js",
      },
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096,
    // Enable CSS code splitting for better caching
    cssCodeSplit: true,
    // Optimize for Railway deployment
    reportCompressedSize: process.env['NODE_ENV'] !== "production",
    // Enable build caching for faster rebuilds
    write: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    force: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  };
});
