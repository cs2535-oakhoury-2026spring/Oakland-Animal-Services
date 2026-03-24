import { type Pet, type PetLocation } from "../models/Pet.schema.js";
import { type ObserverNote } from "../models/ObserverNote.schema.js";



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
  addObserverNote(note: ObserverNote): Promise<boolean>;
  removeObserverNoteById(id: number): Promise<boolean>;
  updateObserverNoteStatus(id: number, status: string): Promise<boolean>;
  removeNotesByPetId(petId: number): Promise<boolean>;

}