# Hook Line Studio - Complete Project Export

## Export Contents

This archive contains the complete source code for Hook Line Studio, an AI-powered social media hook generator.

### Included Directories:
- **client/** - React frontend with TypeScript (2.0MB)
- **server/** - Express backend with Firebase Auth (116KB)  
- **shared/** - Shared TypeScript types and schemas (8KB)

### Key Files:
- **replit.md** - Complete project documentation and architecture
- **package.json** - All dependencies and scripts
- **tsconfig.json** - TypeScript configuration
- **tailwind.config.ts** - Tailwind CSS configuration
- **drizzle.config.ts** - Database configuration
- **vite.config.ts** - Vite build configuration

### Documentation:
- **DESIGN.md** - Design system documentation
- **SECURITY.md** - Security implementation details
- **AUTHENTICATION_CHOICE.md** - Auth system comparison
- **FIREBASE_SETUP.md** - Firebase configuration guide
- **PRODUCTION.md** - Production deployment guide
- **GOOGLE_SIGNIN_FIX.md** - OAuth troubleshooting guide

### Not Included:
- node_modules (install with `npm install`)
- .git directory
- dist/build files
- attached_assets
- environment variables

## How to Use This Export

1. Extract the archive: `tar -xzf hook-line-studio-export.tar.gz`
2. Install dependencies: `npm install`
3. Set up environment variables (see PRODUCTION.md)
4. Run development server: `npm run dev`

## Key Technologies
- React 18 with TypeScript
- Tailwind CSS + Shadcn/ui
- Firebase Authentication
- PostgreSQL with Drizzle ORM
- OpenAI GPT-4o integration
- Stripe subscription system
- Express.js backend

## Project Overview
Hook Line Studio generates AI-powered opening lines for:
- TikTok (optimized for watch time)
- Instagram Reels (optimized for shares/saves)
- YouTube Shorts (optimized for CTR)

The app includes user authentication, profile management, subscription tiers (Free/Pro/Teams), and advanced copywriting frameworks.

Archive size: 1.6MB
Total source code: ~2.1MB uncompressed