import { Pet, PetLocation } from "../models/Pet.schema.js";

export interface PetRepository {
  getById(id: number): Promise<Pet | undefined>;
  getDogIdFromLocation(location: string): Promise<PetLocation[] | undefined>;
  getCatIdFromLocation(location: string): Promise<PetLocation[] | undefined>;
}
