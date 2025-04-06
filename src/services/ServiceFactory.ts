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
export type BackendProvider = 'supabase';

// Get the current backend from environment or config
const getCurrentBackend = (): BackendProvider => {
  return 'supabase';
};

// Service factory
export class ServiceFactory {
  private static instance: ServiceFactory;

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

  public getAuthService(): IAuthService {
    return new SupabaseAuthService();
  }

  public getDatabaseService(): IDatabaseService {
    return new SupabaseDatabaseService();
  }

  public getProfileService(): IProfileService {
    return new SupabaseProfileService();
  }

  public getStorageService(): IStorageService {
    return new SupabaseStorageService();
  }

  static getTranscriptionService(): ITranscriptionService {
    return new TranscriptionService();
  }

  static getVoiceNoteService(): IVoiceNoteService {
    return new SupabaseVoiceNoteService();
  }

  static getEntriesService(): IEntriesService {
    return new SupabaseEntriesService();
  }

  static getConversationsService(): IConversationsService {
    return new SupabaseConversationsService();
  }

  static getMessagesService(): IMessagesService {
    return new SupabaseMessagesService();
  }
} 