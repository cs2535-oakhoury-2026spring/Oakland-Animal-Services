import { Router } from "express";
import {
  createMedicalNote,
  createBehavioralNote,
  getNotesByAnimalId,
  getNotesByDate,
  resolveMedicalNote,
} from "../controllers/observerNotesController.js";

const router = Router();

router.post("/api/pets/:petId/medical-notes", createMedicalNote);
router.post("/api/pets/:petId/behavioral-notes", createBehavioralNote);
router.get("/api/pets/:petId/observer-notes", getNotesByAnimalId);
router.get("/api/observer-notes", getNotesByDate);
router.put("/api/pets/:petId/medical-notes/resolve", resolveMedicalNote);

export default router;
