import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get Supabase URL from environment
const getSupabaseUrl = (): string => {
  return 'http://100.101.151.91:8003'
};

// Get Supabase Anon Key from environment
const getSupabaseAnonKey = (): string => {
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzQxNzMwNDAwLAogICJleHAiOiAxODk5NDk2ODAwCn0.FbSu9tAmN1azLAVjxqBaW1UATMLCo5E7xcdUw-_CRME'
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