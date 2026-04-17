import { type Pet, type PetLocation } from "../models/Pet.schema.js";
import config from "../config/index.js";
import { PetRepository } from "../types/index.js";
import {
  RescueGroupPetRepository,
  type PaginatedAnimalsResult,
} from "./_db/rescueGroupPetDB.js";
import { MockPetRepository } from "./_mock/mockPetDB.js";

const rgRepo = new RescueGroupPetRepository();

const REPO: PetRepository = !config.USE_MOCK_RG_DB
  ? rgRepo
  : new MockPetRepository();

export async function getPetById(id: number): Promise<Pet | undefined> {
  return REPO.getById(id);
}

export async function searchByLocation(
  petType: string,
  location: string,
): Promise<PetLocation[] | undefined> {
  return REPO.searchByLocation(petType, location);
}

export async function getAllAnimals(
  page: number = 1,
  limit: number = 50,
): Promise<PaginatedAnimalsResult> {
  return rgRepo.getAllAnimals(page, limit);
}
