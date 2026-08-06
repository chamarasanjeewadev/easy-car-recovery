/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  /** TowMyCar platform API base for browser-side calls (free DVLA lookup). */
  readonly VITE_TOWMYCAR_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
