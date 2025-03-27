import { IStorageService, FileUploadOptions, FileUploadResult, FileDeleteResult } from '../interfaces/IStorageService';
import { SupabaseClientWrapper } from './SupabaseClient';
import { v4 as uuidv4 } from 'uuid';

export class SupabaseStorageService implements IStorageService {
  private supabase = SupabaseClientWrapper.getInstance().getClient();
  private bucketName = window.env.SUPABASE_BUCKET_NAME || 'voicenotes';
  
  // Test method to verify storage functionality
  async testStorage(): Promise<boolean> {
    try {
      console.log("Testing Supabase storage functionality...");
      
      // Check authentication first
      const isAuth = await SupabaseClientWrapper.getInstance().isAuthenticated();
      if (!isAuth) {
        console.error("Storage test failed: User not authenticated");
        return false;
      }
      
      // List buckets
      const { data: buckets, error: bucketsError } = await this.supabase.storage.listBuckets();
      if (bucketsError) {
        console.error("Failed to list buckets:", bucketsError);
        return false;
      }
      
      console.log("Available buckets:", buckets.map(b => b.name));
      const bucketExists = buckets.some(b => b.name === this.bucketName);
      
      if (!bucketExists) {
        console.error(`Bucket '${this.bucketName}' not found!`);
        return false;
      }
      
      // Try to list files in the bucket
      const { data: files, error: filesError } = await this.supabase.storage
        .from(this.bucketName)
        .list();
        
      if (filesError) {
        console.error(`Failed to list files in bucket '${this.bucketName}':`, filesError);
        return false;
      }
      
      console.log(`Files in bucket '${this.bucketName}':`, files.map(f => f.name));
      
      // Try a simple upload using Uint8Array
      const testString = "test";
      const encoder = new TextEncoder();
      const testData = encoder.encode(testString);
      const testPath = `test-${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from(this.bucketName)
        .upload(testPath, testData, {
          contentType: "text/plain",
          upsert: true
        });
        
      if (uploadError) {
        console.error("Test upload failed:", uploadError);
        return false;
      }
      
      console.log("Test upload successful:", uploadData);
      
      // Clean up test file
      await this.supabase.storage
        .from(this.bucketName)
        .remove([testPath]);
        
      return true;
    } catch (error) {
      console.error("Storage test exception:", error);
      return false;
    }
  }

  /**
   * Upload a file to Supabase storage with organized path structure
   * @param options The file upload options
   * @returns Object containing fileId or error
   */
  async uploadFile(options: FileUploadOptions): Promise<FileUploadResult> {
    try {
      console.log("options", options);
      console.log("Starting file upload with options:", {
        filename: options.filename,
        fileType: typeof options.file === 'object' && 'uri' in options.file ? 'VoiceNoteFile' : options.file instanceof Blob ? 'Blob' : 'File',
        path: options.path
      });
      
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
      console.log(`Generated file ID: ${fileId}`);
      
      // Handle file upload
      let fileData: Uint8Array;
      let contentType: string;
      let fileExt: string = 'bin';
      
      if ('uri' in file) {
        // Handle VoiceNoteFile format
        console.log("Processing file as VoiceNoteFile");
        contentType = file.type;
        fileExt = file.type.split('/')[1] || 'bin';
        
        // Fetch the file data from the URI
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const arrayBuffer = await this.blobToArrayBuffer(blob);
        fileData = new Uint8Array(arrayBuffer);
      } else if (file instanceof Blob || File) {
        console.log("Processing file as Blob/File");
        contentType = file.type;
        fileExt = file.type.split('/')[1] || 'bin';
        
        // Convert Blob/File to ArrayBuffer then to Uint8Array
        const arrayBuffer = await this.blobToArrayBuffer(file);
        fileData = new Uint8Array(arrayBuffer);
      } else {
        console.error("Invalid file format, must be Blob, File, or VoiceNoteFile");
        throw new Error('Invalid file format');
      }
      
      console.log(`Converted file to Uint8Array, size: ${fileData.length} bytes`);
      
      // Create file path with the provided path prefix
      const filePath = path 
        ? `${path}/${fileId}${filename ? `-${filename}` : `.${fileExt}`}`
        : `${fileId}${filename ? `-${filename}` : `.${fileExt}`}`;
      
      console.log(`File path for upload: ${filePath}`);
      
      // Upload the file to Supabase storage
      console.log(`Uploading to bucket: ${this.bucketName}, path: ${filePath}`);
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
        
        console.log("File uploaded successfully:", data);
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