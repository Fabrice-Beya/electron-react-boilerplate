import { Profile } from "../../types";
import { IProfileService } from '../interfaces/IProfileService';
import { SupabaseClientWrapper } from './SupabaseClient';

export class SupabaseProfileService implements IProfileService {
  private clientWrapper: SupabaseClientWrapper;

  constructor() {
    this.clientWrapper = SupabaseClientWrapper.getInstance();
  }

  async getProfile(userId: string) {
    try {
      const client = await this.clientWrapper.getClient();
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      return {
        $id: data.id,
        userId: data.id,
        fullName: data.full_name || '',
        username: data.username || '',
        avatar_url: data.avatar_url || '',
        website: data.website || '',
        $createdAt: data.created_at || '',
        $updatedAt: data.updated_at || ''
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  }

  async createProfile(profile: Profile) {
    try {
      const client = await this.clientWrapper.getClient();
      const { data, error } = await client
        .from('profiles')
        .insert({
          id: profile.userId,
          full_name: profile.fullName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        $id: data.id,
        userId: data.id,
        fullName: data.full_name || '',
        username: data.username || '',
        avatar_url: data.avatar_url || '',
        website: data.website || '',
        $createdAt: data.created_at || '',
        $updatedAt: data.updated_at || ''
      };
    } catch (error) {
      console.error("Error creating profile:", error);
      throw error;
    }
  }

  async updateProfile(profile: Profile) {
    try {
      const client = await this.clientWrapper.getClient();
      const { data, error } = await client
        .from('profiles')
        .update({
          full_name: profile.fullName,
          username: profile.username,
          avatar_url: profile.avatar_url,
          website: profile.website,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.userId)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        $id: data.id,
        userId: data.id,
        fullName: data.full_name || '',
        username: data.username || '',
        avatar_url: data.avatar_url || '',
        website: data.website || '',
        $createdAt: data.created_at || '',
        $updatedAt: data.updated_at || ''
      };
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }

  async deleteProfile(userId: string) {
    try {
      const client = await this.clientWrapper.getClient();
      const { error } = await client
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting profile:", error);
      throw error;
    }
  }
} 