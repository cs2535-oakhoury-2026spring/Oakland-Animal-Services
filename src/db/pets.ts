import { type Pet, type PetLocation } from "../models/Pet.schema.js";
import { PetRepository } from "../types/index.js";
import {
  RescueGroupPetRepository,
  type PaginatedAnimalsResult,
} from "./repositories/rescueGroupPetDB.js";

const rgRepo = new RescueGroupPetRepository();
const REPO: PetRepository = rgRepo;

export async function getPetById(
  id: number | string,
): Promise<Pet | undefined> {
  return REPO.getById(id);
}

export async function searchByLocation(
  petType: string,
  location: string,
  refresh: boolean = false,
): Promise<PetLocation[] | undefined> {
  return REPO.searchByLocation(petType, location, refresh);
}

export async function getAllAnimals(
  page: number = 1,
  limit: number = 50,
): Promise<PaginatedAnimalsResult> {
  return rgRepo.getAllAnimals(page, limit);
}
