import { Request, Response } from "express";
import {
  getPetById,
  searchByLocation,
} from "../db/pets.js";

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

  const petType = (petTypeRaw ?? "").toLowerCase();
  const location = locationRaw ?? "";

  if (!location) {
    return res.status(400).json({ error: "Location is required" });
  }

  const pet = await searchByLocation(petType, location);

  if (!pet) {
    return res.status(404).json({ error: "Pet not found" });
  }

  res.json({ success: true, pets: pet });
}
