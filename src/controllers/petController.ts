import { Request, Response } from "express";
import {
  getPetById,
  getCatIdFromLocation,
  getDogIdFromLocation,
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

  let pet;
  if (petType === "dog") {
    pet = await getDogIdFromLocation(location);
  } else if (petType === "cat") {
    pet = await getCatIdFromLocation(location);
  } else {
    return res.status(400).json({
      error: "Invalid pet type. Use 'dog' or 'cat' in the URL.",
    });
  }

  if (!pet) {
    return res.status(404).json({ error: "Pet not found" });
  }

  res.json({ success: true, petId: pet });
}
