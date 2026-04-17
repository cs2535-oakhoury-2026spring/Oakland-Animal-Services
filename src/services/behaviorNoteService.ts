import { type BehaviorNote } from "../models/BehaviorNote.schema.js";
import {
  getAllBehaviorNotes as _getAllBehaviorNotes,
  getBehaviorNotesByPetId as _getBehaviorNotesByPetId,
  addBehaviorNote as _addBehaviorNote,
  removeBehaviorNoteById as _removeBehaviorNoteById,
  removeNotesByPetId as _removeNotesByPetId,
} from "../db/behaviorNotes.js";

export type { BehaviorNote };

/**
 * Retrieves behavior notes with optional pagination.
 *
 * @param limit - Maximum notes to return.
 * @param page - 1-based page index.
 * @returns Behavior notes for the requested page.
 */
export async function getAllBehaviorNotes(
  limit?: number,
  page?: number,
): Promise<BehaviorNote[]> {
  return _getAllBehaviorNotes(limit, page);
}

/**
 * Retrieves all behavior notes for a specific pet.
 *
 * @param petId - Numeric pet identifier.
 * @returns Behavior notes linked to the pet.
 */
export async function getBehaviorNotesByPetId(
  petId: number,
): Promise<BehaviorNote[]> {
  return _getBehaviorNotesByPetId(petId);
}

/**
 * Persists a new behavior note.
 *
 * @param note - Behavior note payload.
 * @returns True when persistence succeeds; false otherwise.
 */
export async function addBehaviorNote(note: BehaviorNote): Promise<boolean> {
  return _addBehaviorNote(note);
}

/**
 * Deletes a single behavior note by its unique id.
 *
 * @param id - Unique note id.
 * @returns True when a note is removed; false otherwise.
 */
export async function removeBehaviorNoteById(id: number): Promise<boolean> {
  return _removeBehaviorNoteById(id);
}

/**
 * Deletes all behavior notes for a specific pet.
 *
 * @param petId - Numeric pet identifier.
 * @returns True when one or more notes are removed; false otherwise.
 */
export async function removeNotesByPetId(petId: number): Promise<boolean> {
  return _removeNotesByPetId(petId);
}
