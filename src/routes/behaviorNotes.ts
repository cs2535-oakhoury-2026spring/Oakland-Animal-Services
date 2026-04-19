import { Router } from "express";
import {
  listBehaviorNotes,
  uploadBehaviorNote,
  getBehaviorNotesByPetId,
  deleteBehaviorNote,
  deleteBehaviorNotesByPetId,
} from "../controllers/behaviorNotesController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.get("/api/behavior-notes", authenticate, listBehaviorNotes);
router.get("/api/pets/:petId/behavior-notes", authenticate, getBehaviorNotesByPetId);
router.post("/api/behavior-notes", authenticate, uploadBehaviorNote);
router.delete("/api/behavior-notes/:id", authenticate, deleteBehaviorNote);
router.delete("/api/pets/:petId/behavior-notes", authenticate, deleteBehaviorNotesByPetId);

export default router;
