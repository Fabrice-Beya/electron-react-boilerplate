interface Window {
  env: {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_BUCKET_NAME: string;
    BACKEND_PROVIDER: string;
    LLM_API_URL_DEEPSEEK: string;
    LLM_API_KEY_DEEPSEEK: string;
    LLM_API_URL_OLLAMA: string;
    LLM_API_KEY_OLLAMA: string;
    DEFAULT_AI_PROVIDER?: 'deepseek' | 'ollama';
  };
} 