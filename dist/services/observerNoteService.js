import { findSimilarNotes } from "../utils/observerNoteSearch.js";
import { getAllNotes as _getAllNotes, addNote as _addNote, seedNotes as _seedNotes } from "../db/notes.js";
export function getAllNotes() {
    return _getAllNotes();
}
export function addNote(note) {
    _addNote(note);
}
export function searchNotes(query, options = {}) {
    // the underlying search util still returns a map keyed by note, but
    // we can adjust the result shape later if necessary. For now, keep as is.
    return findSimilarNotes(query, _getAllNotes(), options);
}
// initialize sample data (used by server startup or tests)
export function seedNotes(initial) {
    _seedNotes(initial);
}
