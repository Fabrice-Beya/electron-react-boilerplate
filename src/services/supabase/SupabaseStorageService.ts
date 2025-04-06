import { IStorageService, FileUploadOptions, FileUploadResult, FileDeleteResult } from '../interfaces/IStorageService';
import { SupabaseClientWrapper } from './SupabaseClient';
import { v4 as uuidv4 } from 'uuid';

export class SupabaseStorageService implements IStorageService {
  private supabase = SupabaseClientWrapper.getInstance().getClient();
  private bucketName = 'voicenotes';

  /**
   * Upload a file to Supabase storage with organized path structure
   * @param options The file upload options
   * @returns Object containing fileId or error
   */
  async uploadFile(options: FileUploadOptions): Promise<FileUploadResult> {
    try {
      // Check authentication first
      const isAuth = await SupabaseClientWrapper.getInstance().isAuthenticated();
      if (!isAuth) {
        return {
          fileId: null,
          error: new Error('User must be authenticated to upload files')
        };
      }

      const { file, filename, path } = options;

      // Generate a unique file ID
      const fileId = uuidv4();

      // Handle file upload
      let fileData: Uint8Array;
      let contentType: string;
      let fileExt: string = 'bin';

      if ('uri' in file) {
        // Handle VoiceNoteFile format
        contentType = file.type;
        fileExt = file.type.split('/')[1] || 'bin';

        // Fetch the file data from the URI
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const arrayBuffer = await this.blobToArrayBuffer(blob);
        fileData = new Uint8Array(arrayBuffer);
      } else if (file instanceof Blob || File) {
        contentType = file.type;
        fileExt = file.type.split('/')[1] || 'bin';

        // Convert Blob/File to ArrayBuffer then to Uint8Array
        const arrayBuffer = await this.blobToArrayBuffer(file);
        fileData = new Uint8Array(arrayBuffer);
      } else {
        console.error("Invalid file format, must be Blob, File, or VoiceNoteFile");
        throw new Error('Invalid file format');
      }

      // Create file path with the provided path prefix
      const filePath = path
        ? `${path}/${fileId}${filename ? `-${filename}` : `.${fileExt}`}`
        : `${fileId}${filename ? `-${filename}` : `.${fileExt}`}`;

      // Upload the file to Supabase storage
      try {
        const { data, error } = await this.supabase
          .storage
          .from(this.bucketName)
          .upload(filePath, fileData, {
            contentType: contentType,
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          console.error("Supabase storage upload error:", error);
          return { fileId: null, error: new Error(error.message) };
        }

        return { fileId: data.path, error: null };
      } catch (uploadError) {
        console.error("Exception during Supabase upload:", uploadError);
        throw uploadError;
      }
    } catch (error) {
      console.error("Error in uploadFile method:", error);
      return {
        fileId: null,
        error: error instanceof Error ? error : new Error('Unknown error during upload')
      };
    }
  }

  /**
   * Delete a file from Supabase storage
   * @param fileId The path of the file to delete
   * @returns Object indicating success or error
   */
  async deleteFile(fileId: string): Promise<FileDeleteResult> {
    try {
      const { error } = await this.supabase
        .storage
        .from(this.bucketName)
        .remove([fileId]);

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error("Error deleting file:", error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error during file deletion')
      };
    }
  }

  /**
   * Get a file download URL
   * @param fileId The path of the file
   * @returns The download URL for the file
   */
  getFileUrl(fileId: string): string {
    const { data } = this.supabase
      .storage
      .from(this.bucketName)
      .getPublicUrl(fileId);

    return data.publicUrl;
  }

  /**
   * Helper method to convert Blob to ArrayBuffer
   */
  private async blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert Blob to ArrayBuffer'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Error reading Blob as ArrayBuffer'));
      };
      reader.readAsArrayBuffer(blob);
    });
  }
} 