import {
  type ObserverNote,
} from "../../models/ObserverNote.schema.js";
import { ObserverNoteRepository } from "../../types/index.js";

export class ObserverNoteDBRepository implements ObserverNoteRepository {
  /**
   * Retrieves all observer notes with optional pagination.
   * @param limit - Maximum number of notes to return.
   * @param page - Page number for pagination (1-indexed).
   * @returns A promise resolving to an array of ObserverNote objects.
   */
  async getObserverNotes(limit?: number, page?: number): Promise<ObserverNote[]> {
    throw new Error("ObserverNoteDBRepository: getObserverNotes not implemented");
  }

  /**
   * Retrieves all observer notes associated with a specific pet.
   * @param petId - The integer ID of the pet.
   * @returns A promise resolving to an array of ObserverNote objects for that pet.
   */
  async getObserverNoteByPetId(petId: number): Promise<ObserverNote[]> {
    throw new Error("ObserverNoteDBRepository: getObserverNoteByPetId not implemented");
  }

  /**
   * Inserts a new observer note into the database.
   * @param note - The ObserverNote object to add, including content, author, petId, timestamp, and optional status.
   * @returns A promise resolving to true if the insert succeeded, false otherwise.
   */
  async addObserverNote(note: ObserverNote): Promise<boolean> {
    throw new Error("ObserverNoteDBRepository: addObserverNote not implemented");
  }

  /**
   * Deletes a single observer note by its ID.
   * @param id - The integer ID of the observer note to remove.
   * @returns A promise resolving to true if the deletion succeeded, false otherwise.
   */
  async removeObserverNoteById(id: number): Promise<boolean> {
    throw new Error("ObserverNoteDBRepository: removeObserverNoteById not implemented");
  }

  /**
   * Updates the status field of a specific observer note.
   * @param id - The integer ID of the observer note to update.
   * @param status - The new status string to set on the note.
   * @returns A promise resolving to true if the update succeeded, false otherwise.
   */
  async updateObserverNoteStatus(id: number, status: string): Promise<boolean> {
    throw new Error("ObserverNoteDBRepository: updateObserverNoteStatus not implemented");
  }

  /**
   * Deletes all observer notes associated with a specific pet.
   * @param petId - The integer ID of the pet whose notes should be removed.
   * @returns A promise resolving to true if the deletions succeeded, false otherwise.
   */
  async removeNotesByPetId(petId: number): Promise<boolean> {
    throw new Error("ObserverNoteDBRepository: removeNotesByPetId not implemented");
  }
}
