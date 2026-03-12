import { Request, Response } from "express";
import { getPetById } from "../db/pets.js";

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
