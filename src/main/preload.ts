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
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
    SUPABASE_BUCKET_NAME: process.env.SUPABASE_BUCKET_NAME || 'voicenotes',
    BACKEND_PROVIDER: process.env.BACKEND_PROVIDER || 'supabase',
    LLM_API_URL_DEEPSEEK: process.env.LLM_API_URL_DEEPSEEK || '',
    LLM_API_KEY_DEEPSEEK: process.env.LLM_API_KEY_DEEPSEEK || '',
    LLM_API_URL_OLLAMA: process.env.LLM_API_URL_OLLAMA || '',
    LLM_API_KEY_OLLAMA: process.env.LLM_API_KEY_OLLAMA || '',
    DEFAULT_AI_PROVIDER: process.env.DEFAULT_AI_PROVIDER || 'deepseek',
  };

  // Expose environment variables to renderer process
  contextBridge.exposeInMainWorld('env', envVars);

  // Send environment variables to renderer process
  ipcRenderer.send('env-vars-updated', envVars);
};

// Initialize environment variables immediately
initializeEnv();

export type ElectronHandler = typeof electronHandler;
