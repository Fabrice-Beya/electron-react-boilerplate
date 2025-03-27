import { Profile } from "@/types";
import { IProfileService } from '../interfaces/IProfileService';
import { SupabaseClientWrapper } from './SupabaseClient';

export class SupabaseProfileService implements IProfileService {
  private supabase = SupabaseClientWrapper.getInstance().getClient();

  async getProfile(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      console.log(data);
      return {
        $id: data.id,
        userId: data.id,
        fullName: data.fullName,
        username: data.username,
        avatar_url: data.avatar_url,
        website: data.website,
        $createdAt: data.createdAt,
        $updatedAt: data.updatedAt
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  }

  async createProfile(profile: Profile) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .insert({
          id: profile.userId,
          fullName: profile.fullName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        $id: data.id,
        userId: data.id,
        fullName: data.fullName,
        $createdAt: data.createdAt,
        $updatedAt: data.updatedAt
      };
    } catch (error) {
      console.error("Error creating profile:", error);
      throw error;
    }
  }

  async updateProfile(profile: Profile) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          fullName: profile.fullName,
          username: profile.username,
          avatar_url: profile.avatar_url,
          website: profile.website,
          updatedAt: new Date().toISOString()
        })
        .eq('id', profile.userId)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        $id: data.id,
        userId: data.id,
        fullName: data.fullName,
        username: data.username,
        avatar_url: data.avatar_url,
        website: data.website,
        $createdAt: data.createdAt,
        $updatedAt: data.updatedAt
      };
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }

  async deleteProfile(userId: string) {
    try {
      const { error } = await this.supabase
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