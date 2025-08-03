import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  return {
  envPrefix: ['VITE_'],
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      // Ensure proper React hooks context in production
      fastRefresh: mode !== 'production'
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
    target: ['es2020', 'chrome80', 'firefox78', 'safari13'],
    minify: "esbuild",
    sourcemap: process.env['NODE_ENV'] !== "production",
    rollupOptions: {
      external: [],
      output: {
        format: 'es',
        manualChunks: (id) => {
          // CRITICAL FIX: Include all React-dependent libraries in react-vendor chunk
          // This prevents "Cannot read properties of undefined (reading 'useState')" errors
          // Critical fix for React Hook dispatcher issues on Vercel
          // Keep React ecosystem together to prevent hook context fragmentation
          if (id.includes('react') || id.includes('react-dom') || id.includes('@radix-ui') || id.includes('wouter') || id.includes('@tanstack/react-query') || (id.includes('node_modules') && (id.includes('use-sync-external-store') || id.includes('scheduler')))) {
            return 'react-vendor';
          }
          // UI libraries that depend on React (excluding Radix which is now with React)
          if (id.includes('framer-motion')) {
            return 'ui-vendor';
          }
          // Independent utilities
          if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('lucide-react')) {
            return 'utils-vendor';
          }
          // Keep node_modules together for better caching
          if (id.includes('node_modules')) {
            return 'vendor';
          }
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
        chunkFileNames: "assets/js/[name]-[hash]-v2025.08.03.012.js",
        entryFileNames: "assets/js/[name]-[hash]-v2025.08.03.012.js",
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
    include: [
      'react', 
      'react-dom', 
      'react-dom/client',
      '@radix-ui/react-slot',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu'
      ,
      // Include React-dependent libraries to prevent loading order issues
      'wouter',
      '@tanstack/react-query'    ],
    force: true,
    // Ensure React hooks are properly resolved
    entries: ['client/src/main.tsx'],
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
