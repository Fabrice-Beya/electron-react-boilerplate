import { Entry, VoiceNote } from "../../types";

export interface VoiceNoteFile {
  file: { 
    uri: string; 
    type: string; 
    name?: string; 
    size?: number 
  };
  filename?: string;
}

export interface VoiceNoteMetadata {
  duration: number;
  transcript?: string;
}

export interface EntryResult {
  data: Entry | null;
  error: Error | null;
}

export interface EntriesResult {
  data: Entry[];
  error: Error | null;
}

export interface DeleteResult {
  success: boolean;
  error: Error | null;
}

export interface IEntriesService {
  getEntries(userId: string): Promise<EntriesResult>;
  searchEntries(userId: string, searchQuery: string): Promise<EntriesResult>;
  createEntry(
    entry: Omit<Entry, 'createdAt' | 'updatedAt' | 'voicenotes'>,
    voiceNotes: VoiceNote[],
    isDraft: boolean
  ): Promise<EntryResult>;
  getEntry(id: string): Promise<EntryResult>;
  updateEntry(
    entryId: string,
    entryData: Partial<{
      title: string;
      content: string;
    }>,
    voiceNotes: VoiceNote[],
    isDraft: boolean
  ): Promise<EntryResult>;
  deleteEntry(id: string): Promise<DeleteResult>;
  removeVoiceNote(
    entryId: string,
    voiceNoteId: string,
    deleteVoiceNote?: boolean
  ): Promise<EntryResult>;
} 