import {
  BehaviorNoteSchema,
  type BehaviorNote,
} from "../models/BehaviorNote.schema.js";
import config from "../config/index.js";
import { BehaviorNoteRepository } from "../types/index.js";
import { MockBehaviorNoteRepository } from "./_mock/mockBehaviorNotesDB.js";
import { BehaviorNoteDBRepository } from "./_db/behaviorNotesDB.js";

const REPO: BehaviorNoteRepository = config.USE_MOCK_NOTES_DB
  ? new MockBehaviorNoteRepository()
  : new BehaviorNoteDBRepository();

export async function getAllBehaviorNotes(
  limit?: number,
  page?: number,
): Promise<BehaviorNote[]> {
  return REPO.getBehaviorNotes(limit, page);
}

export async function getBehaviorNotesByPetId(
  petId: number,
): Promise<BehaviorNote[]> {
  return REPO.getBehaviorNoteByPetId(petId);
}

export async function addBehaviorNote(note: BehaviorNote): Promise<boolean> {
  return REPO.addBehaviorNote(note);
}

export async function removeBehaviorNoteById(id: number): Promise<boolean> {
  return REPO.removeBehaviorNoteById(id);
}

export async function removeNotesByPetId(petId: number): Promise<boolean> {
  return REPO.removeNotesByPetId(petId);
}

export function seedBehaviorNotes(initial: BehaviorNote[]): void {
  if (REPO instanceof MockBehaviorNoteRepository) {
    REPO.seedBehaviorNotes(initial);
  } else {
    throw new Error("Unable to seed Behavior notes for current repository");
  }
}
