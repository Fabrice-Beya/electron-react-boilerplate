// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example' | 'update-env-vars' | 'env-vars-updated';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

// Initialize environment variables
const initializeEnv = () => {
  const envVars = {
    SUPABASE_URL: 'http://100.101.151.91:8003',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzQxNzMwNDAwLAogICJleHAiOiAxODk5NDk2ODAwCn0.FbSu9tAmN1azLAVjxqBaW1UATMLCo5E7xcdUw-_CRME',
    BACKEND_PROVIDER: 'supabase',
    LLM_API_URL_DEEPSEEK: 'https://api.deepseek.com/v1',
    LLM_API_KEY_DEEPSEEK: 'sk-c68ec96d7dd947fd974ad1d212c47f36',
    LLM_API_URL_OLLAMA: 'http://100.101.151.91:11434',
    DEFAULT_AI_PROVIDER: 'ollama',
  };

  // Expose environment variables to renderer process
  contextBridge.exposeInMainWorld('env', envVars);

  // Send environment variables to renderer process
  ipcRenderer.send('env-vars-updated', envVars);
};

// Initialize environment variables immediately
initializeEnv();

export type ElectronHandler = typeof electronHandler;
