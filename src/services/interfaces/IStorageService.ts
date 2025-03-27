export interface FileUploadOptions {
  file: Blob | { uri: string; type: string; name?: string; size?: number };
  filename?: string;
  path?: string;
}

export interface FileUploadResult {
  fileId: string | null;
  error: Error | null;
}

export interface FileDeleteResult {
  success: boolean;
  error: Error | null;
}

export interface IStorageService {
  uploadFile(options: FileUploadOptions): Promise<FileUploadResult>;
  deleteFile(fileId: string): Promise<FileDeleteResult>;
  getFileUrl(fileId: string): string;
} 