export interface AudioFile {
  uri: string;
  type: string;
  name?: string;
}

export interface TranscriptionResponse {
  success: boolean;
  text?: string;
  error?: string;
}

export interface ITranscriptionService {
  transcribeAudio(fileId: string): Promise<TranscriptionResponse>;
} 