import { Pet } from "../models/schemas/Pet.schema.js";

export interface PetRepository {
  getById(id: number): Promise<Pet | undefined>;
  getDogIdFromLocation(location: string): Promise<number | undefined>;
  getCatIdFromLocation(location: string): Promise<number | undefined>;
}
