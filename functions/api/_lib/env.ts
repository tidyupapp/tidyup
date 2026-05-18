export interface Env {
  DB: D1Database;
  FIREBASE_PROJECT_ID: string;
  ALLOWED_ORIGINS: string;
  APP_BASE_URL: string;
  EBAY_RUNAME: string;
  EBAY_ENVIRONMENT: string;
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
  EBAY_CLIENT_ID?: string;
  EBAY_CLIENT_SECRET?: string;
}
