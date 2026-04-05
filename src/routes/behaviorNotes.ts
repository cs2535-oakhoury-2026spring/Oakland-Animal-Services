import { Router } from "express";
import {
  listBehaviorNotes,
  uploadBehaviorNote,
  getBehaviorNotesByPetId,
  deleteBehaviorNote,
  deleteBehaviorNotesByPetId,
} from "../controllers/behaviorNotesController.js";

const router = Router();
router.get("/api/behavior-notes", listBehaviorNotes);
router.get("/api/pets/:petId/behavior-notes", getBehaviorNotesByPetId);
router.post("/api/behavior-notes", uploadBehaviorNote);
router.delete("/api/behavior-notes/:id", deleteBehaviorNote);
router.delete("/api/pets/:petId/behavior-notes", deleteBehaviorNotesByPetId);

export default router;
