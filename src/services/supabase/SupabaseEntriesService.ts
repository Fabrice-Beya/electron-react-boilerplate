import { IEntriesService, EntryResult, EntriesResult, DeleteResult } from '../interfaces/IEntriesService';
import { Entry, VoiceNote } from "../../types";
import { SupabaseClientWrapper } from './SupabaseClient';
import { SupabaseVoiceNoteService } from './SupabaseVoiceNoteService';

export class SupabaseEntriesService implements IEntriesService {
  private supabase = SupabaseClientWrapper.getInstance().getClient();
  private voiceNoteService = new SupabaseVoiceNoteService();

  // Helper function to map Supabase record to Entry domain type
  private mapRecordToEntry(record: any, voiceNotes: VoiceNote[] = []): Entry {
    // Add debug logging
    return {
      id: record.id,
      title: record.title,
      content: record.content,
      createdAt: record.createdAt || record.created_at,
      updatedAt: record.updatedAt || record.updated_at,
      userId: record.userId || record.user_id,
      voicenotes: voiceNotes || [],
      isDraft: record.isDraft || record.is_draft,
    };
  }

  // Client-side search function as fallback
  private clientSideSearch(entries: Entry[], searchQuery: string): Entry[] {
    const query = searchQuery.toLowerCase();
    return entries.filter(entry =>
      entry.title.toLowerCase().includes(query) ||
      entry.content.toLowerCase().includes(query)
    );
  }

  // Get all entries
  async getEntries(userId: string): Promise<EntriesResult> {
    try {
      // Get all entries for the user, ordered by updatedAt descending
      const { data: entries, error } = await this.supabase
        .from('entries')
        .select('*')
        .eq('userId', userId)
        .order('updatedAt', { ascending: false });
      if (error) {
        return { data: [], error: new Error(error.message) };
      }

      // For each entry, get its voice notes
      const entriesWithVoiceNotes = await Promise.all(entries.map(async (entry) => {
        const { data: voiceNotes } = await this.voiceNoteService.getVoiceNotesByEntryId(entry.id);
        return this.mapRecordToEntry(entry, voiceNotes);
      }));

      return { data: entriesWithVoiceNotes, error: null };
    } catch (error) {
      return { data: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Search entries by title or content
  async searchEntries(userId: string, searchQuery: string): Promise<EntriesResult> {
    try {
      if (!searchQuery.trim()) {
        return this.getEntries(userId);
      }

      try {
        // Try server-side search using Supabase text search
        const { data: entries, error } = await this.supabase
          .from('entries')
          .select('*')
          .eq('userId', userId)
          .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);

        if (error) {
          throw error;
        }

        // For each entry, get its voice notes
        const entriesWithVoiceNotes = await Promise.all(entries.map(async (entry) => {
          const { data: voiceNotes } = await this.voiceNoteService.getVoiceNotesByEntryId(entry.id);
          return this.mapRecordToEntry(entry, voiceNotes);
        }));

        return { data: entriesWithVoiceNotes, error: null };
      } catch (searchError) {
        console.log("Server-side search failed, falling back to client-side search:", searchError);

        // Fallback to client-side search if server-side search fails
        const { data: allEntries, error: fetchError } = await this.getEntries(userId);

        if (fetchError) {
          return { data: [], error: fetchError };
        }

        // Perform client-side filtering
        const filteredEntries = this.clientSideSearch(allEntries, searchQuery);
        return { data: filteredEntries, error: null };
      }
    } catch (error) {
      return { data: [], error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  /**
   * Create a new entry with optional voice notes
   * @param entry Entry data without id, createdAt, updatedAt
   * @param voiceNoteFiles Array of voice note files to upload
   * @param voiceNoteMetadata Array of metadata for each voice note
   * @returns Object containing the created entry or error
   */
  async createEntry(
    entry: Omit<Entry, 'createdAt' | 'updatedAt' | 'voicenotes'>,
    voiceNotes: VoiceNote[] = [],
    isDraft: boolean = false
  ): Promise<EntryResult> {
    try {

      // First, create the entry
      const { data: newEntry, error } = await this.supabase
        .from('entries')
        .insert({
          id: entry.id,
          title: entry.title,
          content: entry.content,
          userId: entry.userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDraft: isDraft
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating entry:", error);
        return { data: null, error: new Error(error.message) };
      }

      console.log("Entry created successfully:", newEntry);

      return {
        data: this.mapRecordToEntry(newEntry, voiceNotes),
        error: null
      };
    } catch (error) {
      console.error("Error in createEntry:", error);
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Get a single entry by ID
  async getEntry(id: string): Promise<EntryResult> {
    try {
      const { data: entry, error } = await this.supabase
        .from('entries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      // Get voice notes for this entry
      const { data: voiceNotes } = await this.voiceNoteService.getVoiceNotesByEntryId(id);

      return {
        data: this.mapRecordToEntry(entry, voiceNotes),
        error: null
      };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  /**
   * Update an existing entry
   * @param entryId ID of the entry to update
   * @param entryData Updated entry data
   * @returns Object containing the updated entry or error
   */
  async updateEntry(
    entryId: string,
    entryData: Partial<{
      title: string;
      content: string;
    }>,
    voiceNotes: VoiceNote[] = [],
    isDraft: boolean = false
  ): Promise<EntryResult> {
    try {
      // First update the entry
      const { data: updatedEntry, error } = await this.supabase
        .from('entries')
        .update({
          title: entryData.title,
          content: entryData.content,
          updatedAt: new Date().toISOString(),
          isDraft: isDraft
        })
        .eq('id', entryId)
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return {
        data: this.mapRecordToEntry(updatedEntry, voiceNotes),
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Delete an entry and its associated voice notes
   * @param id Entry ID
   * @returns Object indicating success or error
   */
  async deleteEntry(id: string): Promise<DeleteResult> {
    try {
      // Get voice notes for this entry
      const { data: voiceNotes } = await this.voiceNoteService.getVoiceNotesByEntryId(id);

      // Delete the entry
      const { error } = await this.supabase
        .from('entries')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      // Delete all associated voice notes
      if (voiceNotes && voiceNotes.length > 0) {
        for (const voiceNote of voiceNotes) {
          await this.voiceNoteService.deleteVoiceNote(voiceNote.id);
        }
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  /**
   * Remove a voice note from an entry
   * @param entryId Entry ID
   * @param voiceNoteId Voice note ID to remove
   * @param deleteVoiceNote Whether to delete the voice note or just remove the association
   * @returns Object containing the updated entry or error
   */
  async removeVoiceNote(
    entryId: string,
    voiceNoteId: string,
    deleteVoiceNote: boolean = true
  ): Promise<EntryResult> {
    try {
      // First check if the voice note is associated with this entry
      const { data: voiceNote, error: getError } = await this.voiceNoteService.getVoiceNote(voiceNoteId);

      if (getError) {
        return { data: null, error: getError };
      }

      if (!voiceNote || voiceNote.entryId !== entryId) {
        return { data: null, error: new Error('Voice note not found in this entry') };
      }

      if (deleteVoiceNote) {
        // Delete the voice note
        await this.voiceNoteService.deleteVoiceNote(voiceNoteId);
      } else {
        // Just remove the association
        await this.supabase
          .from('voicenotes')
          .update({ entryId: null, updatedAt: new Date().toISOString() })
          .eq('id', voiceNoteId);
      }

      // Get the updated entry
      return this.getEntry(entryId);
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
} 