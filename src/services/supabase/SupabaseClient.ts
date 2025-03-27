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
  
  // Add connection testing method
  public async testConnection(): Promise<boolean> {
    try {
      console.log("Testing Supabase connection...");
      const client = this.getClient();
      
      // First check authentication
      const { data: authData, error: authError } = await client.auth.getSession();
      if (authError) {
        console.error("Auth session error:", authError);
      } else {
        console.log("Auth session:", authData.session ? "active" : "none");
      }
      
      // Then check storage access
      console.log("Testing storage access...");
      const { data: buckets, error: bucketsError } = await client.storage.listBuckets();
      
      if (bucketsError) {
        console.error("Storage buckets error:", bucketsError);
        return false;
      }
      
      console.log("Available buckets:", buckets.map(b => b.name));
      return true;
    } catch (error) {
      console.error("Supabase connection test failed:", error);
      return false;
    }
  }
  
  // Check if user is authenticated
  public async isAuthenticated(): Promise<boolean> {
    try {
      const client = this.getClient();
      const { data, error } = await client.auth.getSession();
      if (error || !data.session) {
        console.log("User is not authenticated");
        return false;
      }
      console.log("User is authenticated:", data.session.user.id);
      return true;
    } catch (error) {
      console.error("Authentication check failed:", error);
      return false;
    }
  }
}