import { ITranscriptionService, AudioFile, TranscriptionResponse } from '../interfaces/ITranscriptionService';
import axios from 'axios';
import { SupabaseClientWrapper } from '../supabase/SupabaseClient';
import { ServiceFactory } from '../ServiceFactory';

export class TranscriptionService implements ITranscriptionService {
  private supabase = SupabaseClientWrapper.getInstance().getClient();

  /**
   * Transcribe an existing file in Supabase storage
   * @param fileId - The ID of the file in Supabase storage
   */
  async transcribeAudio(fileId: string): Promise<TranscriptionResponse> {
    // Call the Supabase function with the file ID
    console.log('Calling Supabase function to transcribe file with ID:', fileId);

    try {
      const { data, error } = await this.supabase.functions.invoke('transcribe', {
        body: { fileId },
      });

      console.log('Transcription function response:', data);

      if (error) {
        console.error('Transcription function error:', error);
        throw new Error(`Supabase function error: ${error}`);
      }

      if (!data || !data.success) {
        const errorMsg = data?.error || 'Unknown transcription error';
        console.error('Transcription failed:', errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }

      return {
        success: data.success,
        text: data.text,
        error: data.error,
      };
    } catch (err) {
      console.error('Error in transcribeExistingFile:', err);
      throw err;
    }
  }
} 