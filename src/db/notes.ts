import { ObserverNoteSchema, type ObserverNote } from "../models/ObserverNote.schema.js";

const _notes: ObserverNote[] = [];

export function getAllNotes(): ObserverNote[] {
  return _notes;
}

export function addNote(note: ObserverNote): void {
  ObserverNoteSchema.parse(note);
  _notes.push(note);
}

export function seedNotes(initial: ObserverNote[]) {
  _notes.length = 0;
  initial.forEach((note) => ObserverNoteSchema.parse(note));
  _notes.push(...initial);
}
