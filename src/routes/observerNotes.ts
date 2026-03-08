import { Router } from "express";
import { listObserverNotes, uploadObserverNote } from "../controllers/observerNotesController.js";

const router = Router();
router.get("/api/observer-notes", listObserverNotes);
router.post("/api/observer-notes", uploadObserverNote);

export default router;
