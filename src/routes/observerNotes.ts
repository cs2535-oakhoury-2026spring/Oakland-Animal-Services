import { Router } from "express";
import {
  listObserverNotes,
  uploadObserverNote,
  getObserverNotesByPetId,
  deleteObserverNote,
  patchObserverNoteStatus,
  deleteObserverNotesByPetId,
} from "../controllers/observerNotesController.js";

const router = Router();
router.get("/api/observer-notes", listObserverNotes);
router.get("/api/pets/:petId/observer-notes", getObserverNotesByPetId);
router.post("/api/observer-notes", uploadObserverNote);
router.delete("/api/observer-notes/:id", deleteObserverNote);
router.delete("/api/pets/:petId/observer-notes", deleteObserverNotesByPetId);
router.patch("/api/observer-notes/:id/status", patchObserverNoteStatus);

export default router;
