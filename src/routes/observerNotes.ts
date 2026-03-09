import { Router } from "express";
import {
  listObserverNotes,
  uploadObserverNote,
  getObserverNotesByPetId,
} from "../controllers/observerNotesController.js";

const router = Router();
router.get("/api/observer-notes", listObserverNotes);
router.get("/api/pets/:petId/observer-notes", getObserverNotesByPetId);
router.post("/api/observer-notes", uploadObserverNote);

export default router;
