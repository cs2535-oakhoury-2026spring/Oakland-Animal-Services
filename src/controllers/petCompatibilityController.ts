import { Request, Response } from "express";
import {
  getCompatibility,
  upsertCompatibility,
} from "../db/repositories/petCompatibilityDB.js";

export async function getCompatibilityHandler(req: Request, res: Response) {
  const petId = parseInt(req.params.petId as string);
  if (isNaN(petId)) return res.status(400).json({ error: "Invalid petId" });

  const data = await getCompatibility(petId);
  res.json({ success: true, compatibility: data || { petId } });
}

export async function updateCompatibilityHandler(req: Request, res: Response) {
  const petId = parseInt(req.params.petId as string);
  if (isNaN(petId)) return res.status(400).json({ error: "Invalid petId" });

  const { kidsOver12, kidsUnder12, canLiveWithCats, dogToDog } = req.body;
  const ok = await upsertCompatibility({
    petId,
    kidsOver12,
    kidsUnder12,
    canLiveWithCats,
    dogToDog,
  });
  if (!ok) return res.status(500).json({ error: "Failed to save" });
  res.json({ success: true });
}
