import { AuthError, User } from '@supabase/supabase-js';
import { IAuthService } from '../interfaces/IAuthService';
import { AuthResponse, UserCredentials, UserData } from '../../types';
import { SupabaseClientWrapper } from './SupabaseClient';

export class SupabaseAuthService implements IAuthService {
  private clientWrapper: SupabaseClientWrapper;

  constructor() {
    this.clientWrapper = SupabaseClientWrapper.getInstance();
  }

  async register(credentials: UserCredentials, name?: string): Promise<UserData | null> {
    try {
      const client = await this.clientWrapper.getClient();
      const { data, error } = await client.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: name || ''
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('User registration failed');

      return {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name,
        createdAt: data.user.created_at || '',
        updatedAt: data.user.updated_at || ''
      };
    } catch (error) {
      console.error('Registration error:', error);
      return null;
    }
  }

  async login(credentials: UserCredentials): Promise<UserData | null> {
    try {
      const client = await this.clientWrapper.getClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) throw error;
      if (!data.user) throw new Error('Login failed');

      return {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name,
        createdAt: data.user.created_at || '',
        updatedAt: data.user.updated_at || ''
      };
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  async getCurrentUser(): Promise<UserData | null> {
    try {
      const client = await this.clientWrapper.getClient();
      const { data: { user }, error } = await client.auth.getUser();
      if (error) throw error;
      if (!user) return null;

      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name,
        createdAt: user.created_at || '',
        updatedAt: user.updated_at || ''
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async logout(): Promise<AuthResponse> {
    try {
      const client = await this.clientWrapper.getClient();
      const { error } = await client.auth.signOut();
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Logout error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Logout failed'
      };
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const client = await this.clientWrapper.getClient();
      const { data: { session }, error } = await client.auth.getSession();
      if (error) throw error;
      return !!session;
    } catch (error) {
      console.error('Check authentication error:', error);
      return false;
    }
  }

  async updateUserName(name: string): Promise<AuthResponse> {
    try {
      const client = await this.clientWrapper.getClient();
      const { error } = await client.auth.updateUser({
        data: { name }
      });
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Update user name error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update user name'
      };
    }
  }

  async updateUserEmail(email: string, password: string): Promise<AuthResponse> {
    try {
      const client = await this.clientWrapper.getClient();
      const { error } = await client.auth.updateUser({
        email,
        password
      });
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Update user email error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update user email'
      };
    }
  }

  async updateUserPassword(oldPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      const client = await this.clientWrapper.getClient();
      const { error } = await client.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Update user password error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update user password'
      };
    }
  }
} 
