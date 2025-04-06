import { IVoiceNoteService, VoiceNoteFile, VoiceNoteMetadata, VoiceNoteResult, VoiceNotesResult, DeleteResult } from '../interfaces/IVoiceNoteService';
import { VoiceNote } from "../../types";
import { SupabaseClientWrapper } from './SupabaseClient';
import { SupabaseStorageService } from './SupabaseStorageService';
import { v4 as uuidv4 } from 'uuid';

export class SupabaseVoiceNoteService implements IVoiceNoteService {
  private supabase = SupabaseClientWrapper.getInstance().getClient();
  private storageService = new SupabaseStorageService();
  
  // Helper function to map Supabase record to VoiceNote domain type
  private mapRecordToVoiceNote(record: any): VoiceNote {
    return {
      id: record.id,
      fileId: record.fileId,
      duration: record.duration,
      transcript: record.transcript || "",
      createdAt: record.createdAt,
      userId: record.userId,
      entryId: record.entryId
    };
  }

  /**
   * Create a new voice note
   * @param file Voice note file metadata
   * @param metadata Voice note metadata
   * @returns Object containing the created voice note or error
   */
  async createVoiceNote(
    file: VoiceNoteFile,
    metadata: VoiceNoteMetadata
  ): Promise<VoiceNoteResult> {
    try {
      
      // Check schema
      await this.checkSchema();
      
      // Generate voice note ID
      const voiceNoteId = uuidv4();
      
      // Determine the storage path based on user ID and entry ID (if available)
      let storagePath = `${metadata.userId}/voicenotes`;
      
      // If this voice note is already associated with an entry, include the entry ID in the path
      if (metadata.entryId) {
        storagePath = `${metadata.userId}/entries/${metadata.entryId}/voicenotes`;
      }
      
      // First upload the file
      const { fileId, error: uploadError } = await this.storageService.uploadFile({
        file: {
          uri: file.uri,
          type: file.type || 'audio/wav',
          name: file.name,
          size: file.size
        },
        filename: file.name,
        path: storagePath
      });
      
      if (uploadError) {
        console.error("File upload failed:", uploadError);
        return { data: null, error: uploadError };
      }
      
      if (!fileId) {
        console.error("No fileId returned from upload");
        return { data: null, error: new Error('Failed to upload voice note file') };
      }
      
      
      // Create voice note record
      try {
        const { data, error } = await this.supabase
          .from('voicenotes')
          .insert({
            id: voiceNoteId,
            fileId,
            duration: metadata.duration,
            transcript: metadata.transcript || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: metadata.userId,
            entryId: metadata.entryId || null, // Set entryId if provided
          })
          .select()
          .single();
        
        if (error) {
          console.error("Database insert error:", error);
          // Clean up the uploaded file if record creation fails
          await this.storageService.deleteFile(fileId);
          return { data: null, error: new Error(error.message) };
        }
        
        return { data: this.mapRecordToVoiceNote(data), error: null };
      } catch (dbError) {
        console.error("Exception during database insert:", dbError);
        // Clean up the uploaded file
        await this.storageService.deleteFile(fileId);
        throw dbError;
      }
    } catch (error) {
      console.error("Error in createVoiceNote method:", error);
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
  
  /**
   * Get a voice note by ID
   * @param id Voice note ID
   * @returns Object containing the voice note or error
   */
  async getVoiceNote(id: string): Promise<VoiceNoteResult> {
    try {
      const { data, error } = await this.supabase
        .from('voicenotes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data: this.mapRecordToVoiceNote(data), error: null };
    } catch (error) {
      console.error("Error fetching voice note:", error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error fetching voice note') 
      };
    }
  }
  
  /**
   * Get voice notes by IDs
   * @param ids Array of voice note IDs
   * @returns Object containing array of voice notes or error
   */
  async getVoiceNotesByIds(ids: string[]): Promise<VoiceNotesResult> {
    try {
      if (ids.length === 0) {
        return { data: [], error: null };
      }
      
      const { data, error } = await this.supabase
        .from('voicenotes')
        .select('*')
        .in('id', ids);
      
      if (error) {
        return { data: [], error: new Error(error.message) };
      }
      
      const voiceNotes = data.map(record => this.mapRecordToVoiceNote(record));
      return { data: voiceNotes, error: null };
    } catch (error) {
      console.error("Error fetching voice notes by IDs:", error);
      return { data: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
  
  /**
   * Get voice notes by entry ID
   * @param entryId Entry ID
   * @returns Object containing array of voice notes or error
   */
  async getVoiceNotesByEntryId(entryId: string): Promise<VoiceNotesResult> {
    try {
      const { data, error } = await this.supabase
        .from('voicenotes')
        .select('*')
        .eq('entryId', entryId);
      
      if (error) {
        return { data: [], error: new Error(error.message) };
      }
      
      const voiceNotes = data.map(record => this.mapRecordToVoiceNote(record));
      return { data: voiceNotes, error: null };
    } catch (error) {
      console.error("Error fetching voice notes by entry ID:", error);
      return { data: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
  
  /**
   * Update a voice note's transcript
   * @param id Voice note ID
   * @param transcript New transcript text
   * @returns Object containing the updated voice note or error
   */
  async updateTranscript(
    id: string, 
    transcript: string
  ): Promise<VoiceNoteResult> {
    try {
      const { data, error } = await this.supabase
        .from('voicenotes')
        .update({ 
          transcript,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data: this.mapRecordToVoiceNote(data), error: null };
    } catch (error) {
      console.error("Error updating voice note transcript:", error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error updating transcript') 
      };
    }
  }
  
  /**
   * Delete a voice note and its associated file
   * @param id Voice note ID
   * @returns Object indicating success or error
   */
  async deleteVoiceNote(id: string): Promise<DeleteResult> {
    try {
      // First get the voice note to get the file ID
      const { data: voiceNote, error: getError } = await this.getVoiceNote(id);
      
      if (getError) {
        return { success: false, error: getError };
      }
      
      if (!voiceNote) {
        return { success: false, error: new Error('Voice note not found') };
      }
      
      // Delete the record
      const { error } = await this.supabase
        .from('voicenotes')
        .delete()
        .eq('id', id);
      
      if (error) {
        return { success: false, error: new Error(error.message) };
      }
      
      // Delete the file
      try {
        await this.storageService.deleteFile(voiceNote.fileId);
      } catch (fileError) {
        console.error("Failed to delete voice note file:", fileError);
        // We'll continue even if file deletion fails
      }
      
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
  
  /**
   * Get the download URL for a voice note's audio file
   * @param fileId The file ID of the voice note
   * @returns The download URL for the audio file
   */
  getVoiceNoteUrl(fileId: string): string {
    // add extension to fileId
    return this.storageService.getFileUrl(fileId);
  }
  
  /**
   * Associate a voice note with an entry
   * @param voiceNoteId Voice note ID
   * @param entryId Entry ID
   * @returns Object containing the updated voice note or error
   */
  async associateWithEntry(
    voiceNoteId: string,
    entryId: string
  ): Promise<VoiceNoteResult> {
    try {
      
      // First, check if the voice note exists
      const { data: voiceNote, error: getError } = await this.supabase
        .from('voicenotes')
        .select('*')
        .eq('id', voiceNoteId)
        .single();
      
      if (getError) {
        console.error("Error getting voice note:", getError);
        return { data: null, error: new Error(getError.message) };
      }
      
      if (!voiceNote) {
        return { data: null, error: new Error('Voice note not found') };
      }
      
      // If the voice note is already associated with this entry, no need to update
      if (voiceNote.entryId === entryId) {
        return { data: this.mapRecordToVoiceNote(voiceNote), error: null };
      }
      
      // If the file is already in storage, we need to move it to the new path
      if (voiceNote.fileId) {
        try {
          // Get the current file path
          const currentPath = voiceNote.fileId;
          
          // Determine the new path
          const fileName = currentPath.split('/').pop() || '';
          const newPath = `${voiceNote.userId}/entries/${entryId}/voicenotes/${fileName}`;
          
          // Only move the file if the paths are different
          if (currentPath !== newPath) {
            
            // Get the file content
            const { data: fileData } = await this.supabase.storage
              .from(process.env.EXPO_PUBLIC_SUPABASE_BUCKET_NAME || 'voicenotes')
              .download(currentPath);
            
            if (fileData) {
              // Upload to the new location
              const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from(process.env.EXPO_PUBLIC_SUPABASE_BUCKET_NAME || 'voicenotes')
                .upload(newPath, fileData, {
                  upsert: true
                });
              
              if (!uploadError && uploadData) {
                // Delete the old file
                await this.supabase.storage
                  .from(process.env.EXPO_PUBLIC_SUPABASE_BUCKET_NAME || 'voicenotes')
                  .remove([currentPath]);
                
                // Update the fileId in the database
                voiceNote.fileId = newPath;
              }
            }
          }
        } catch (moveError) {
          console.error("Error moving file:", moveError);
          // Continue with the association even if file move fails
        }
      }
      
      // Update the voice note with the entry ID
      const { data, error } = await this.supabase
        .from('voicenotes')
        .update({ 
          entryId: entryId,
          fileId: voiceNote.fileId, // Use the potentially updated fileId
          updatedAt: new Date().toISOString()
        })
        .eq('id', voiceNoteId)
        .select()
        .single();
      
      if (error) {
        console.error("Error associating voice note with entry:", error);
        return { data: null, error: new Error(error.message) };
      }
      
      return { data: this.mapRecordToVoiceNote(data), error: null };
    } catch (error) {
      console.error("Exception associating voice note with entry:", error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error associating voice note') 
      };
    }
  }

  private async checkSchema(): Promise<boolean> {
    try {
      
      // Try to get the column information
      const { data, error } = await this.supabase
        .from('voicenotes')
        .select('id, fileId, entryId, userId, createdAt, updatedAt')
        .limit(1);
      
      if (error) {
        console.error("Error checking schema:", error);
        
        // Try with snake_case column names
        const { error: snakeCaseError } = await this.supabase
          .from('voicenotes')
          .select('id, file_id, entry_id, user_id, created_at, updated_at')
          .limit(1);
        
        if (!snakeCaseError) {
          return false;
        }
        
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Exception checking schema:", error);
      return false;
    }
  }
} 