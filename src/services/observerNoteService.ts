import { findSimilarNotes, NoteData } from "../utils/observerNoteSearch.js";
import {
  ObserverNoteSchema,
  type ObserverNote,
} from "../models/ObserverNote.schema.js";
import {
  getAllObserverNotes as _getAllObserverNotes,
  addObserverNote as _addObserverNote,
  getObserverNotesByPetId as _getObserverNotesByPetId,
  removeObserverNoteById as _removeObserverNoteById,
  removeNotesByPetId as _removeNotesByPetId,
  updateObserverNoteStatus as _updateObserverNoteStatus,
} from "../db/observerNotes.js";

export type { ObserverNote };

/**
 * Similarity search output for observer notes.
 *
 * Contains the matched note, keyword-level match metadata, and pre-highlighted
 * title/content strings that can be rendered directly in the UI.
 */
export type SimilarNoteResult = {
  observerNote: ObserverNote;
  matchCount: number;
  matchedKeywords: Array<{
    keyword: string;
    positions: Array<{ start: number; end: number }>;
  }>;
  highlightedContent: string;
  highlightedTitle: string;
};

/**
 * Retrieves observer notes with optional pagination.
 *
 * @param limit - Maximum notes to return.
 * @param page - 1-based page index.
 * @returns Observer notes for the requested page.
 */
export async function getAllObserverNotes(
  limit?: number,
  page?: number,
): Promise<ObserverNote[]> {
  return _getAllObserverNotes(limit, page);
}

/**
 * Retrieves all observer notes for a specific pet.
 *
 * @param petId - Numeric pet identifier.
 * @returns Observer notes linked to the pet.
 */
export async function getObserverNotesByPetId(
  petId: number,
): Promise<ObserverNote[]> {
  return _getObserverNotesByPetId(petId);
}

/**
 * Deletes a single observer note by its unique id.
 *
 * @param id - Unique note id.
 * @returns True when a note is removed; false otherwise.
 */
export async function removeObserverNoteById(id: number): Promise<boolean> {
  return _removeObserverNoteById(id);
}

/**
 * Deletes all observer notes for a specific pet.
 *
 * @param petId - Numeric pet identifier.
 * @returns True when one or more notes are removed; false otherwise.
 */
export async function removeNotesByPetId(petId: number): Promise<boolean> {
  return _removeNotesByPetId(petId);
}

/**
 * Updates the status of an observer note.
 *
 * @param id - Unique note id.
 * @param status - New status string to persist.
 * @returns True when the status update succeeds; false otherwise.
 */
export async function updateObserverNoteStatus(
  id: number,
  status: string,
): Promise<boolean> {
  return _updateObserverNoteStatus(id, status);
}

/**
 * Persists a new observer note.
 *
 * @param note - Observer note payload.
 * @returns True when persistence succeeds; false otherwise.
 */
export async function addObserverNote(note: ObserverNote): Promise<boolean> {
  return _addObserverNote(note);
}

/**
 * Performs fuzzy similarity search over observer notes.
 *
 * Behavior:
 * - If `options.petId` is provided, search is scoped to that pet.
 * - Otherwise, paged notes are fetched via `getAllObserverNotes`.
 * - Matches are ranked and returned with highlight markup metadata.
 *
 * @param query - Free-form search text.
 * @param options - Search scope and result controls.
 * @returns Ranked similarity results, optionally truncated by `maxResults`.
 */
export async function findSimilarObserverNotes(
  query: string,
  options: {
    nameToExclude?: string;
    maxResults?: number;
    page?: number;
    noteDataCache?: Map<string, NoteData>;
    petId?: number;
  } = {},
): Promise<SimilarNoteResult[]> {
  const notes = options.petId
    ? await getObserverNotesByPetId(options.petId)
    : await getAllObserverNotes(options.maxResults, options.page);

  const results = findSimilarNotes(query, notes, options);

  if (options.maxResults) {
    return results.slice(0, options.maxResults);
  }
  return results;
}
