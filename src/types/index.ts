import { Pet } from "../models/Pet.schema.js";


export interface PetRepository {
  getById(id: number): Promise<Pet | undefined>;
}
