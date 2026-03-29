import { Request, Response } from "express";
import {
  getPetById,
  searchByLocation,
} from "../db/pets.js";

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
