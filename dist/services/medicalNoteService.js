import { findSimilarNotes } from "../utils/observerNoteSearch.js";
// simple in-memory store; later this can be replaced with a database layer
const _notes = [];
export function getAllNotes() {
    return _notes;
}
export function addNote(note) {
    _notes.push(note);
}
export function searchNotes(query, options = {}) {
    return findSimilarNotes(query, _notes, options);
}
// initialize sample data (used by server startup or tests)
export function seedNotes(initial) {
    _notes.length = 0;
    _notes.push(...initial);
}
