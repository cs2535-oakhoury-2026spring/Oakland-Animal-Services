import {
  type ObserverNote,
} from "../../models/ObserverNote.schema.js";
import { ObserverNoteRepository } from "../../types/index.js";

export class ObserverNoteDBRepository implements ObserverNoteRepository {
  async getObserverNotes(limit?: number, page?: number): Promise<ObserverNote[]> {
    throw new Error("ObserverNoteDBRepository: getObserverNotes not implemented");
  }

  async getObserverNoteByPetId(petId: number): Promise<ObserverNote[]> {
    throw new Error("ObserverNoteDBRepository: getObserverNoteByPetId not implemented");
  }

  async addObserverNote(note: ObserverNote): Promise<boolean> {
    throw new Error("ObserverNoteDBRepository: addObserverNote not implemented");
  }

  async removeObserverNoteById(id: number): Promise<boolean> {
    throw new Error("ObserverNoteDBRepository: removeObserverNoteById not implemented");
  }

  async updateObserverNoteStatus(id: number, status: string): Promise<boolean> {
    throw new Error("ObserverNoteDBRepository: updateObserverNoteStatus not implemented");
  }

  async removeNotesByPetId(petId: number): Promise<boolean> {
    throw new Error("ObserverNoteDBRepository: removeNotesByPetId not implemented");
  }
}
