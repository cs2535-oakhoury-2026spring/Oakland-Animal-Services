import { type BehaviorNote } from "../models/BehaviorNote.schema.js";
import {
  getAllBehaviorNotes as _getAllBehaviorNotes,
  addBehaviorNote as _addBehaviorNote,
  getBehaviorNoteById as _getBehaviorNoteById,
  getBehaviorNotesByPetId as _getBehaviorNotesByPetId,
  removeBehaviorNoteById as _removeBehaviorNoteById,
  removeNotesByPetId as _removeNotesByPetId,
} from "../db/behaviorNotes.js";

export type { BehaviorNote };

export async function getAllBehaviorNotes(
  limit?: number,
  page?: number,
): Promise<BehaviorNote[]> {
  return _getAllBehaviorNotes(limit, page);
}

export async function getBehaviorNotesByPetId(
  petId: number,
): Promise<BehaviorNote[]> {
  return _getBehaviorNotesByPetId(petId);
}

export async function getBehaviorNoteById(
  id: number,
): Promise<BehaviorNote | null> {
  return _getBehaviorNoteById(id);
}

export async function addBehaviorNote(note: BehaviorNote): Promise<number> {
  return _addBehaviorNote(note);
}

export async function removeBehaviorNoteById(id: number): Promise<boolean> {
  return _removeBehaviorNoteById(id);
}

export async function removeNotesByPetId(petId: number): Promise<boolean> {
  return _removeNotesByPetId(petId);
}
