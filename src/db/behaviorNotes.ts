import { type BehaviorNote } from "../models/BehaviorNote.schema.js";
import { BehaviorNoteRepository } from "../types/index.js";
import { BehaviorNoteDBRepository } from "./repositories/behaviorNotesDB.js";
import config from "../config/index.js";
import { RescueGroupBehaviorNotesRepository } from "./rescueGroups/rescueGroupBehaviorNotesDB.js";

const REPO: BehaviorNoteRepository = config.useAwsNotes
  ? new BehaviorNoteDBRepository()
  : new RescueGroupBehaviorNotesRepository();

if (
  !config.useAwsNotes &&
  (!config.rescueGroups.endpoint || !config.rescueGroups.bearer)
) {
  console.warn(
    "USE_AWS_NOTES=false but RESCUE_GROUPS_ENDPOINT or RESCUE_GROUPS_BEARER is missing.",
  );
}

export async function getAllBehaviorNotes(
  limit?: number,
  page?: number,
): Promise<BehaviorNote[]> {
  return REPO.getNotes(limit, page);
}

export async function getBehaviorNotesByPetId(
  petId: number,
): Promise<BehaviorNote[]> {
  return REPO.getNoteByPetId(petId);
}

export async function getBehaviorNoteById(
  id: number,
): Promise<BehaviorNote | null> {
  return REPO.getNoteById(id);
}

export async function addBehaviorNote(note: BehaviorNote): Promise<number> {
  return REPO.addNote(note);
}

export async function removeBehaviorNoteById(id: number): Promise<boolean> {
  return REPO.removeNoteById(id);
}

export async function removeNotesByPetId(petId: number): Promise<boolean> {
  return REPO.removeNotesByPetId(petId);
}
