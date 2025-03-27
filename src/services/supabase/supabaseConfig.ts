import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get Supabase URL from environment
const getSupabaseUrl = (): string => {
  const configuredUrl = window.env?.SUPABASE_URL;
  if (!configuredUrl) {
    throw new Error('Supabase URL not configured');
  }
  return configuredUrl;
};

// Get Supabase Anon Key from environment
const getSupabaseAnonKey = (): string => {
  const anonKey = window.env?.SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('Supabase Anon Key not configured');
  }
  return anonKey;
};

// Create Supabase client
const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: {
      getItem: (key: string) => {
        try {
          const item = localStorage.getItem(key);
          return Promise.resolve(item);
        } catch (error) {
          return Promise.reject(error);
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
          return Promise.resolve();
        } catch (error) {
          return Promise.reject(error);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
          return Promise.resolve();
        } catch (error) {
          return Promise.reject(error);
        }
      },
    },
  },
});

export { supabase }; 