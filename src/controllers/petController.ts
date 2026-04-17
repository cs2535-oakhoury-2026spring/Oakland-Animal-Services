import { Request, Response } from "express";
import { getPetById, searchByLocation, getAllAnimals } from "../db/pets.js";
import { PetLocation } from "../models/Pet.schema.js";
import config from "../config/index.js";

const PET_LOCATION_CACHE_TTL = config.PET_LOCATION_CACHE_TTL;
const petLocationCache: Map<string, PetLocation[]> = new Map();

/**
 * Retrieves a single pet by its unique identifier.
 *
 * @param req - Express request object containing the `petId` in path parameters.
 * @param res - Express response object.
 * @returns A JSON response with the pet object or a 404 error if not found.
 */
export async function getPet(req: Request, res: Response) {
  const petIdParam = req.params.petId;
  const petId = typeof petIdParam === "string" ? parseInt(petIdParam) : NaN;
  if (isNaN(petId)) {
    return res.status(400).json({ error: "Invalid pet ID" });
  }
  const pet = await getPetById(petId);
  if (!pet) {
    return res.status(404).json({ error: "Pet not found" });
  }
  res.json({ success: true, pet });
}

/**
 * Searches for pets by type and geographic location.
 *
 * @param req - Express request object containing `petType` and `location` in path parameters.
 * @param res - Express response object.
 * @returns A JSON response with a list of pets matching the criteria or a 404 error.
 */
export async function getPetByLocation(req: Request, res: Response) {
  const petTypeRaw =
    typeof req.params.petType === "string" ? req.params.petType : "";

  const locationRaw =
    typeof req.params.location === "string" ? req.params.location : "";

  const refresh = req.query.refresh === "true";

  const cacheKey = `${petTypeRaw}:${locationRaw}`;
  const cached = petLocationCache.get(cacheKey);

  if (cached && !refresh) {
    return res.json({ success: true, pets: cached });
  }

  const petType = (petTypeRaw ?? "").toLowerCase();
  const location = locationRaw ?? "";

  if (!location) {
    return res.status(400).json({ error: "Location is required" });
  }

  const pet = await searchByLocation(petType, location);

  if (!pet) {
    return res.status(404).json({ error: "Pet not found" });
  }
  petLocationCache.set(cacheKey, pet);
  setTimeout(() => petLocationCache.delete(cacheKey), PET_LOCATION_CACHE_TTL);
  res.json({ success: true, pets: pet });
}

export async function getAllAnimalsHandler(req: Request, res: Response) {
  try {
    const pageRaw =
      typeof req.query.page === "string" ? Number(req.query.page) : 1;
    const limitRaw =
      typeof req.query.limit === "string" ? Number(req.query.limit) : 50;
    const page =
      Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 50;

    const result = await getAllAnimals(page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("getAllAnimals failed", err);
    res.status(500).json({ success: false, error: "Failed to fetch animals" });
  }
}
