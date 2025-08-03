/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NODE_ENV: 'development' | 'production'
  readonly REPL_ID?: string
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string
  readonly VITE_OPENAI_API_KEY?: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production'
    readonly REPL_ID?: string
    readonly PORT?: string
    readonly DATABASE_URL?: string
    readonly OPENAI_API_KEY?: string
    readonly STRIPE_SECRET_KEY?: string
    readonly STRIPE_WEBHOOK_SECRET?: string
    readonly SENDGRID_API_KEY?: string
    readonly FIREBASE_ADMIN_PRIVATE_KEY?: string
    readonly FIREBASE_ADMIN_CLIENT_EMAIL?: string
    readonly FIREBASE_ADMIN_PROJECT_ID?: string
  }
}