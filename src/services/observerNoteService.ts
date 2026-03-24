import { findSimilarNotes, NoteData } from "../utils/observerNoteSearch.js";
import {
  ObserverNoteSchema,
  type ObserverNote,
} from "../models/schemas/ObserverNote.schema.js";
import {
  getAllObserverNotes as _getAllObserverNotes,
  addObserverNote as _addObserverNote,
  getObserverNotesByPetId as _getObserverNotesByPetId,
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
};

export function getAllObserverNotes(): ObserverNote[] {
  return _getAllObserverNotes();
}

export function getObserverNotesByPetId(petId: number): ObserverNote[] {
  return _getObserverNotesByPetId(petId);
}

export function addObserverNote(note: ObserverNote): void {
  _addObserverNote(note);
}

export function findSimilarObserverNotes(
  query: string,
  options: {
    nameToExclude?: string;
    maxResults?: number;
    noteDataCache?: Map<string, NoteData>;
  } = {},
): SimilarNoteResult[] {
  return findSimilarNotes(query, getAllObserverNotes(), options);
}
