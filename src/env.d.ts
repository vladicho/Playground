interface Env {
  AI_SEARCH: AiSearchInstance;
  AI: Ai;
  DB?: D1Database;
  DAILY_USER_LIMIT?: string;
  DAILY_GLOBAL_LIMIT?: string;
  GROK_TTS_ENABLED?: string;
}
