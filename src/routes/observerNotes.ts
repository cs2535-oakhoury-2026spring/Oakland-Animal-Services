import { Router } from "express";
import {
  listObserverNotes,
  uploadObserverNote,
  getObserverNotesByPetId,
  deleteObserverNote,
  patchObserverNoteStatus,
  deleteObserverNotesByPetId,
} from "../controllers/observerNotesController.js";
import { authenticate, requireStaff } from "../middleware/auth.js";

const router = Router();
router.get("/api/observer-notes", authenticate, listObserverNotes);
router.get("/api/pets/:petId/observer-notes", authenticate, getObserverNotesByPetId);
router.post("/api/observer-notes", authenticate, uploadObserverNote);
router.delete("/api/observer-notes/:id", authenticate, deleteObserverNote);
router.delete("/api/pets/:petId/observer-notes", authenticate, deleteObserverNotesByPetId);
router.patch("/api/observer-notes/:id/status", authenticate, requireStaff, patchObserverNoteStatus);

export default router;
