import { type Pet } from "../models/Pet.schema.js";
import config from "../config/index.js";
import { PetRepository } from "../types/index.js";
import { RescueGroupPetRepository } from "./rescueGroupPetDB.js";
import { MockPetRepository } from "./mockPetDB.js";

const REPO: PetRepository = !config.USE_MOCK_RG_DB
  ? new RescueGroupPetRepository()
  : new MockPetRepository();

export async function getPetById(id: number): Promise<Pet | undefined> {
  return REPO.getById(id);
}
