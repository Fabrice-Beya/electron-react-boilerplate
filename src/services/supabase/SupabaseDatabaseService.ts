import { IDatabaseService } from '../interfaces/IDatabaseService';
import { SupabaseClientWrapper } from './SupabaseClient';

export class SupabaseDatabaseService implements IDatabaseService {
  private supabase = SupabaseClientWrapper.getInstance().getClient();

  async listDocuments(
    databaseId: string, // In Supabase, this would be the schema name (usually 'public')
    collectionId: string, // In Supabase, this would be the table name
    queries: any[] = []
  ) {
    try {
      // Start building the query
      let query = this.supabase
        .from(collectionId)
        .select('*');
      
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) throw error;
      
      return {
        documents: data || [],
        total: data?.length || 0
      };
    } catch (error: any) {
      console.error("Error listing documents:", error.message);
      return error;
    }
  }

  // Implement other methods...
  async getDocument(
    databaseId: string,
    collectionId: string,
    documentId: string
  ) {
    try {
      const { data, error } = await this.supabase
        .from(collectionId)
        .select('*')
        .eq('id', documentId)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error: any) {
      console.error("Error getting document:", error.message);
      return error;
    }
  }

  async createDocument(
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: any
  ) {
    try {
      // In Supabase, we typically let the database generate IDs
      // But we can use the provided ID if needed
      const { data: result, error } = await this.supabase
        .from(collectionId)
        .insert({ id: documentId, ...data })
        .select()
        .single();
      
      if (error) throw error;
      
      return result;
    } catch (error: any) {
      console.error("Error creating document:", error.message);
      return error;
    }
  }

  async updateDocument(
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: any
  ) {
    try {
      const { data: result, error } = await this.supabase
        .from(collectionId)
        .update(data)
        .eq('id', documentId)
        .select()
        .single();
      
      if (error) throw error;
      
      return result;
    } catch (error: any) {
      console.error("Error updating document:", error.message);
      return error;
    }
  }

  async deleteDocument(
    databaseId: string,
    collectionId: string,
    documentId: string
  ) {
    try {
      const { error } = await this.supabase
        .from(collectionId)
        .delete()
        .eq('id', documentId);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting document:", error.message);
      return error;
    }
  }
} 