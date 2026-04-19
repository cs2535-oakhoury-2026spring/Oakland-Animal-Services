import { type Pet, type PetLocation } from "../models/Pet.schema.js";
import { type ObserverNote } from "../models/ObserverNote.schema.js";
import { type BehaviorNote } from "../models/BehaviorNote.schema.js";


export interface PetRepository {
  getById(id: number | string): Promise<Pet | undefined>;
  searchByLocation(
    petType: string,
    location: string,
    refresh?: boolean,
  ): Promise<PetLocation[] | undefined>;

}

export interface NoteRepository<T> {
  getNotes(limit?: number, page?: number): Promise<T[]>;
  getNoteByPetId(petId: number): Promise<T[]>;
  getNoteById(id: number): Promise<T | null>;
  addNote(note: T): Promise<number>;
  removeNoteById(id: number): Promise<boolean>;
  removeNotesByPetId(petId: number): Promise<boolean>;
}

export interface ObserverNoteRepository extends NoteRepository<ObserverNote> {
  updateObserverNoteStatus(id: number, status: string): Promise<boolean>;
}

export interface BehaviorNoteRepository extends NoteRepository<BehaviorNote> {}
