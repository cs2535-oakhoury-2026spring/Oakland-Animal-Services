import { findSimilarNotes, NoteData } from "../utils/noteSearcher.js";
import {
  ObserverNoteSchema,
  type ObserverNote,
} from "../models/ObserverNote.schema.js";
import {
  getAllObserverNotes as _getAllObserverNotes,
  addObserverNote as _addObserverNote,
  getObserverNoteById as _getObserverNoteById,
  getObserverNotesByPetId as _getObserverNotesByPetId,
  removeObserverNoteById as _removeObserverNoteById,
  removeNotesByPetId as _removeNotesByPetId,
  updateObserverNoteStatus as _updateObserverNoteStatus,
  updateObserverNoteStaffComment as _updateObserverNoteStaffComment,
} from "../db/observerNotes.js";

export type { ObserverNote };

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

export async function getAllObserverNotes(
  limit?: number,
  page?: number,
): Promise<ObserverNote[]> {
  return _getAllObserverNotes(limit, page);
}

export async function getObserverNotesByPetId(
  petId: number,
): Promise<ObserverNote[]> {
  return _getObserverNotesByPetId(petId);
}

export async function getObserverNoteById(
  id: number,
): Promise<ObserverNote | null> {
  return _getObserverNoteById(id);
}

export async function removeObserverNoteById(id: number): Promise<boolean> {
  return _removeObserverNoteById(id);
}

export async function removeNotesByPetId(petId: number): Promise<boolean> {
  return _removeNotesByPetId(petId);
}

export async function updateObserverNoteStatus(
  id: number,
  status: string,
): Promise<boolean> {
  return _updateObserverNoteStatus(id, status);
}

export async function updateObserverNoteStaffComment(
  id: number,
  comment: string,
  actor: string,
): Promise<boolean> {
  return _updateObserverNoteStaffComment(id, comment, actor);
}

export async function addObserverNote(note: ObserverNote): Promise<number> {
  return _addObserverNote(note);
}

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
