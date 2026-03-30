import {
  type BehaviorNote,
} from "../../models/BehaviorNote.schema.js";
import { BehaviorNoteRepository } from "../../types/index.js";

export class BehaviorNoteDBRepository implements BehaviorNoteRepository {
  /**
   * Retrieves all behavior notes with optional pagination.
   * @param limit - Maximum number of notes to return.
   * @param page - Page number for pagination (1-indexed).
   * @returns A promise resolving to an array of BehaviorNote objects.
   */
  async getBehaviorNotes(limit?: number, page?: number): Promise<BehaviorNote[]> {
    throw new Error("BehaviorNoteDBRepository: getBehaviorNotes not implemented");
  }

  /**
   * Retrieves all behavior notes associated with a specific pet.
   * @param petId - The integer ID of the pet.
   * @returns A promise resolving to an array of BehaviorNote objects for that pet.
   */
  async getBehaviorNoteByPetId(petId: number): Promise<BehaviorNote[]> {
    throw new Error("BehaviorNoteDBRepository: getBehaviorNoteByPetId not implemented");
  }

  /**
   * Inserts a new behavior note into the database.
   * @param note - The BehaviorNote object to add, including content, author, petId, and timestamp.
   * @returns A promise resolving to true if the insert succeeded, false otherwise.
   */
  async addBehaviorNote(note: BehaviorNote): Promise<boolean> {
    throw new Error("BehaviorNoteDBRepository: addBehaviorNote not implemented");
  }

  /**
   * Deletes a single behavior note by its ID.
   * @param id - The integer ID of the behavior note to remove.
   * @returns A promise resolving to true if the deletion succeeded, false otherwise.
   */
  async removeBehaviorNoteById(id: number): Promise<boolean> {
    throw new Error("BehaviorNoteDBRepository: removeBehaviorNoteById not implemented");
  }

  /**
   * Deletes all behavior notes associated with a specific pet.
   * @param petId - The integer ID of the pet whose notes should be removed.
   * @returns A promise resolving to true if the deletions succeeded, false otherwise.
   */
  async removeNotesByPetId(petId: number): Promise<boolean> {
    throw new Error("BehaviorNoteDBRepository: removeNotesByPetId not implemented");
  }
}
