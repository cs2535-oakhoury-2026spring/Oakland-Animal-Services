import { findSimilarNotes } from "../utils/observerNoteSearch.js";
import { getAllNotes as _getAllNotes, addNote as _addNote, seedNotes as _seedNotes } from "../db/notes.js";
export function getAllNotes() {
    return _getAllNotes();
}
export function addNote(note) {
    _addNote(note);
}
export function searchNotes(query, options = {}) {
    return findSimilarNotes(query, _getAllNotes(), options);
}
export function seedNotes(initial) {
    _seedNotes(initial);
}
