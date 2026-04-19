import { type Pet, type PetLocation } from "../models/Pet.schema.js";
import { type ObserverNote } from "../models/ObserverNote.schema.js";
import { type BehaviorNote } from "../models/BehaviorNote.schema.js";

export interface PetRepository {
  getById(id: number): Promise<Pet | undefined>;
  searchByLocation(
    petType: string,
    location: string,
  ): Promise<PetLocation[] | undefined>;
}

export interface ObserverNoteRepository {
  getObserverNotes(limit?:number,page?:number): Promise<ObserverNote[]>;
  getObserverNoteByPetId(petId: number): Promise<ObserverNote[]>;
  getObserverNoteById(id: number): Promise<ObserverNote | null>;
  addObserverNote(note: ObserverNote): Promise<number>;
  removeObserverNoteById(id: number): Promise<boolean>;
  updateObserverNoteStatus(id: number, status: string): Promise<boolean>;
  removeNotesByPetId(petId: number): Promise<boolean>;

}

export interface BehaviorNoteRepository {
  getBehaviorNotes(limit?: number, page?: number): Promise<BehaviorNote[]>;
  getBehaviorNoteByPetId(petId: number): Promise<BehaviorNote[]>;
  getBehaviorNoteById(id: number): Promise<BehaviorNote | null>;
  addBehaviorNote(note: BehaviorNote): Promise<number>;
  removeBehaviorNoteById(id: number): Promise<boolean>;
  removeNotesByPetId(petId: number): Promise<boolean>;

}