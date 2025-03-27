import { IAuthService } from './interfaces/IAuthService';
import { IDatabaseService } from './interfaces/IDatabaseService';
import { IProfileService } from './interfaces/IProfileService';
import { IStorageService } from './interfaces/IStorageService';
import { ITranscriptionService } from './interfaces/ITranscriptionService';
import { IVoiceNoteService } from './interfaces/IVoiceNoteService';
import { IEntriesService } from './interfaces/IEntriesService';
import { IConversationsService } from './interfaces/IConversationsService';
import { IMessagesService } from './interfaces/IMessagesService';

import { TranscriptionService } from './common/TranscriptionService';
import { SupabaseDatabaseService } from './supabase/SupabaseDatabaseService';
import { SupabaseAuthService } from './supabase/SupabaseAuthService';
import { SupabaseProfileService } from './supabase/SupabaseProfileService';
import { SupabaseStorageService } from './supabase/SupabaseStorageService';
import { SupabaseVoiceNoteService } from './supabase/SupabaseVoiceNoteService';
import { SupabaseEntriesService } from './supabase/SupabaseEntriesService';
import { SupabaseConversationsService } from './supabase/SupabaseConversationsService';
import { SupabaseMessagesService } from './supabase/SupabaseMessagesService';

// Backend types
export type BackendProvider = 'appwrite' | 'supabase';

// Get the current backend from environment or config
const getCurrentBackend = (): BackendProvider => {
  // Wait for window.env to be available
  if (typeof window === 'undefined' || !window.env) {
    throw new Error('Environment not initialized');
  }
  return (window.env.BACKEND_PROVIDER as BackendProvider) || 'supabase';
};

// Service factory
export class ServiceFactory {
  private static instance: ServiceFactory;
  private authService: IAuthService | null = null;
  private profileService: IProfileService | null = null;
  private storageService: IStorageService | null = null;
  private databaseService: IDatabaseService | null = null;

  private constructor() {}

  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  public static initialize() {
    // Initialize the factory
    ServiceFactory.getInstance();
  }

  // Allow changing the backend at runtime if needed
  static setBackend(backend: BackendProvider): void {
    // Implementation needed
  }

  public getAuthService(): IAuthService {
    if (!this.authService) {
      const backend = getCurrentBackend();
      switch (backend) {
        case 'supabase':
          this.authService = new SupabaseAuthService();
          break;
        default:
          throw new Error(`Unsupported backend: ${backend}`);
      }
    }
    return this.authService;
  }

  public getDatabaseService(): IDatabaseService {
    if (!this.databaseService) {
      const backend = getCurrentBackend();
      switch (backend) {
        case 'supabase':
          this.databaseService = new SupabaseDatabaseService();
          break;
        default:
          throw new Error(`Unsupported backend: ${backend}`);
      }
    }
    return this.databaseService;
  }

  public getProfileService(): IProfileService {
    if (!this.profileService) {
      const backend = getCurrentBackend();
      switch (backend) {
        case 'supabase':
          this.profileService = new SupabaseProfileService();
          break;
        default:
          throw new Error(`Unsupported backend: ${backend}`);
      }
    }
    return this.profileService;
  }

  public getStorageService(): IStorageService {
    if (!this.storageService) {
      const backend = getCurrentBackend();
      switch (backend) {
        case 'supabase':
          this.storageService = new SupabaseStorageService();
          break;
        default:
          throw new Error(`Unsupported backend: ${backend}`);
      }
    }
    return this.storageService;
  }

  static getTranscriptionService(): ITranscriptionService {
    // Transcription service is the same regardless of backend
    return new TranscriptionService();
  }

  static getVoiceNoteService(): IVoiceNoteService {
    if (getCurrentBackend() === 'appwrite') {
      throw new Error('Appwrite voice note service not implemented yet');
    } else {
      return new SupabaseVoiceNoteService();
    }
  }

  static getEntriesService(): IEntriesService {
    if (getCurrentBackend() === 'appwrite') {
      throw new Error('Appwrite entries service not implemented yet');
    } else {
      return new SupabaseEntriesService();
    }
  }

  static getConversationsService(): IConversationsService {
    if (getCurrentBackend() === 'appwrite') {
      throw new Error('Appwrite conversations service not implemented yet');
    } else {
      return new SupabaseConversationsService();
    }
  }

  static getMessagesService(): IMessagesService {
    if (getCurrentBackend() === 'appwrite') {
      throw new Error('Appwrite messages service not implemented yet');
    } else {
      return new SupabaseMessagesService();
    }
  }
} 