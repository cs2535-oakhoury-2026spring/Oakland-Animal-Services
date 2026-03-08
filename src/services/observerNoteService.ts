import { findSimilarNotes, NoteData } from "../utils/observerNoteSearch.js";
import {
  ObserverNoteSchema,
  type ObserverNote,
} from "../models/ObserverNote.schema.js";
import { getAllNotes as _getAllNotes, addNote as _addNote, seedNotes as _seedNotes } from "../db/notes.js";

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

export function getAllNotes(): ObserverNote[] {
  return _getAllNotes();
}

export function addNote(note: ObserverNote): void {
  _addNote(note);
}

export function searchNotes(
  query: string,
  options: {
    nameToExclude?: string;
    maxResults?: number;
    noteDataCache?: Map<string, NoteData>;
  } = {},
): SimilarNoteResult[] {
  return findSimilarNotes(query, _getAllNotes(), options);
}

export function seedNotes(initial: ObserverNote[]) {
  _seedNotes(initial);
}
