interface Window {
  env: {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    BACKEND_PROVIDER: string;
    LLM_API_URL_DEEPSEEK: string;
    LLM_API_KEY_DEEPSEEK: string;
    LLM_API_URL_OLLAMA: string;
    DEFAULT_AI_PROVIDER?: 'ollama';
  };
} 