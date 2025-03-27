import { create, StateCreator } from 'zustand';

export interface EnvVars {
  BACKEND_PROVIDER: string;
  LLM_API_URL_DEEPSEEK: string;
  LLM_API_KEY_DEEPSEEK: string;
  LLM_API_URL_OLLAMA: string;
  LLM_API_KEY_OLLAMA: string;
  DEFAULT_AI_PROVIDER: 'deepseek' | 'ollama';
}

export interface EnvStore {
  envVars: EnvVars;
  setEnvVars: (vars: EnvVars) => void;
  updateEnvVar: (key: keyof EnvVars, value: string) => void;
  initializeFromWindowEnv: () => void;
}

export const useEnvStore = create<EnvStore>((set) => ({
  envVars: {
    BACKEND_PROVIDER: '',
    LLM_API_URL_DEEPSEEK: '',
    LLM_API_KEY_DEEPSEEK: '',
    LLM_API_URL_OLLAMA: '',
    LLM_API_KEY_OLLAMA: '',
    DEFAULT_AI_PROVIDER: 'deepseek',
  },
  setEnvVars: (vars: EnvVars) => set({ envVars: vars }),
  updateEnvVar: (key: keyof EnvVars, value: string) => 
    set((state: EnvStore) => ({ 
      envVars: { ...state.envVars, [key]: value } 
    })),
  initializeFromWindowEnv: () => {
    if (window.env) {
      const {
        BACKEND_PROVIDER,
        LLM_API_URL_DEEPSEEK,
        LLM_API_KEY_DEEPSEEK,
        LLM_API_URL_OLLAMA,
        LLM_API_KEY_OLLAMA,
        DEFAULT_AI_PROVIDER,
      } = window.env;

      set({
        envVars: {
          BACKEND_PROVIDER: BACKEND_PROVIDER || '',
          LLM_API_URL_DEEPSEEK: LLM_API_URL_DEEPSEEK || '',
          LLM_API_KEY_DEEPSEEK: LLM_API_KEY_DEEPSEEK || '',
          LLM_API_URL_OLLAMA: LLM_API_URL_OLLAMA || '',
          LLM_API_KEY_OLLAMA: LLM_API_KEY_OLLAMA || '',
          DEFAULT_AI_PROVIDER: DEFAULT_AI_PROVIDER || 'deepseek',
        }
      });
    }
  },
})); 