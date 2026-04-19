import { type ObserverNote } from "../models/ObserverNote.schema.js";
import { ObserverNoteRepository } from "../types/index.js";
import { ObserverNoteDBRepository } from "./repositories/observerNotesDB.js";

const REPO: ObserverNoteRepository = new ObserverNoteDBRepository();

export async function getAllObserverNotes(
  limit?: number,
  page?: number,
): Promise<ObserverNote[]> {
  return REPO.getNotes(limit, page);
}

export async function getObserverNotesByPetId(
  petId: number,
): Promise<ObserverNote[]> {
  return REPO.getNoteByPetId(petId);
}

export async function getObserverNoteById(
  id: number,
): Promise<ObserverNote | null> {
  return REPO.getNoteById(id);
}

export async function addObserverNote(note: ObserverNote): Promise<number> {
  return REPO.addNote(note);
}

export async function removeObserverNoteById(id: number): Promise<boolean> {
  return REPO.removeNoteById(id);
}

export async function updateObserverNoteStatus(
  id: number,
  status: string,
): Promise<boolean> {
  return REPO.updateObserverNoteStatus(id, status);
}

export async function removeNotesByPetId(petId: number): Promise<boolean> {
  return REPO.removeNotesByPetId(petId);
}

