/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  /** TowMyCar platform API base for browser-side calls (free DVLA lookup). */
  readonly VITE_TOWMYCAR_API_BASE_URL: string
  /** Stripe publishable key (pk_test_/pk_live_) for the Easy Car Recovery Stripe account. */
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
