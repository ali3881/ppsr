/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_PDF_PRICE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
