import { ObserverNoteSchema } from "../models/ObserverNote.schema.js";
const _notes = [];
export function getAllNotes() {
    return _notes;
}
export function addNote(note) {
    ObserverNoteSchema.parse(note);
    _notes.push(note);
}
export function seedNotes(initial) {
    _notes.length = 0;
    initial.forEach((note) => ObserverNoteSchema.parse(note));
    _notes.push(...initial);
}
