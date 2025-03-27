import { VoiceNote } from "../../types";

export interface VoiceNoteFile {
  uri: string;
  type: string;
  name?: string;
  size?: number;
}

export interface VoiceNoteMetadata {
  duration: number;
  transcript?: string;
  userId: string;
  entryId?: string;
}

export interface VoiceNoteResult {
  data: VoiceNote | null;
  error: Error | null;
}

export interface VoiceNotesResult {
  data: VoiceNote[];
  error: Error | null;
}

export interface DeleteResult {
  success: boolean;
  error: Error | null;
}

export interface IVoiceNoteService {
  createVoiceNote(file: VoiceNoteFile, metadata: VoiceNoteMetadata): Promise<VoiceNoteResult>;
  getVoiceNote(id: string): Promise<VoiceNoteResult>;
  getVoiceNotesByIds(ids: string[]): Promise<VoiceNotesResult>;
  updateTranscript(id: string, transcript: string): Promise<VoiceNoteResult>;
  deleteVoiceNote(id: string): Promise<DeleteResult>;
  getVoiceNoteUrl(fileId: string): string;
} 