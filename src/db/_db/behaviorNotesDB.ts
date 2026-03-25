import {
  type BehaviorNote,
} from "../../models/BehaviorNote.schema.js";
import { BehaviorNoteRepository } from "../../types/index.js";

export class BehaviorNoteDBRepository implements BehaviorNoteRepository {
  async getBehaviorNotes(limit?: number, page?: number): Promise<BehaviorNote[]> {
    throw new Error("BehaviorNoteDBRepository: getBehaviorNotes not implemented");
  }

  async getBehaviorNoteByPetId(petId: number): Promise<BehaviorNote[]> {
    throw new Error("BehaviorNoteDBRepository: getBehaviorNoteByPetId not implemented");
  }

  async addBehaviorNote(note: BehaviorNote): Promise<boolean> {
    throw new Error("BehaviorNoteDBRepository: addBehaviorNote not implemented");
  }

  async removeBehaviorNoteById(id: number): Promise<boolean> {
    throw new Error("BehaviorNoteDBRepository: removeBehaviorNoteById not implemented");
  }

  async removeNotesByPetId(petId: number): Promise<boolean> {
    throw new Error("BehaviorNoteDBRepository: removeNotesByPetId not implemented");
  }
}
