import {
  ObserverNoteSchema,
  type ObserverNote,
} from "../models/ObserverNote.schema.js";

const _observerNotes: ObserverNote[] = [];

export function getAllObserverNotes(): ObserverNote[] {
  return [..._observerNotes];
}

export function getObserverNotesByPetId(petId: number): ObserverNote[] {
  return _observerNotes.filter((note) => note.petId === petId);
}

export function addObserverNote(note: ObserverNote): void {
  ObserverNoteSchema.parse(note);
  _observerNotes.push(note);
}

export function seedObserverNotes(initial: ObserverNote[]): void {
  _observerNotes.length = 0;
  for (const note of initial) {
    ObserverNoteSchema.parse(note);
    _observerNotes.push(note);
  }
}
