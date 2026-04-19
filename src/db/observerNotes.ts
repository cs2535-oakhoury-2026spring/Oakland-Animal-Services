import {
  ObserverNoteSchema,
  type ObserverNote,
} from "../models/ObserverNote.schema.js";
import config from "../config/index.js";
import { ObserverNoteRepository } from "../types/index.js";
import { MockObserverNoteRepository } from "./_mock/mockObserverNotesDB.js";
import { ObserverNoteDBRepository } from "./_db/observerNotesDB.js";

const REPO: ObserverNoteRepository = config.USE_MOCK_NOTES_DB
  ? new MockObserverNoteRepository()
  : new ObserverNoteDBRepository();

export async function getAllObserverNotes(
  limit?: number,
  page?: number,
): Promise<ObserverNote[]> {
  return REPO.getObserverNotes(limit, page);
}

export async function getObserverNotesByPetId(
  petId: number,
): Promise<ObserverNote[]> {
  return REPO.getObserverNoteByPetId(petId);
}

export async function getObserverNoteById(
  id: number,
): Promise<ObserverNote | null> {
  return REPO.getObserverNoteById(id);
}

export async function addObserverNote(note: ObserverNote): Promise<number> {
  return REPO.addObserverNote(note);
}

export async function removeObserverNoteById(id: number): Promise<boolean> {
  return REPO.removeObserverNoteById(id);
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

export function seedObserverNotes(initial: ObserverNote[]): void {
  if (REPO instanceof MockObserverNoteRepository) {
    REPO.seedObserverNotes(initial);
  } else {
    throw new Error("Unable to seed observer notes for current repository");
  }
}
