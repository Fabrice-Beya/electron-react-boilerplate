import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabaseConfig';

// Singleton Supabase client
export class SupabaseClientWrapper {
  private static instance: SupabaseClientWrapper;
  private client: SupabaseClient | null = null;

  private constructor() {}

  public static getInstance(): SupabaseClientWrapper {
    if (!SupabaseClientWrapper.instance) {
      SupabaseClientWrapper.instance = new SupabaseClientWrapper();
    }
    return SupabaseClientWrapper.instance;
  }

  public getClient(): SupabaseClient {
    if (!this.client) {
      this.client = supabase;
    }
    return this.client;
  }
  
  
  // Check if user is authenticated
  public async isAuthenticated(): Promise<boolean> {
    try {
      const client = this.getClient();
      const { data, error } = await client.auth.getSession();
      if (error || !data.session) {
        return false;
      }
      return true;
    } catch (error) {
      console.error("Authentication check failed:", error);
      return false;
    }
  }
}