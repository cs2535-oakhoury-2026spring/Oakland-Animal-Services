import { Request, Response } from "express";
import { z } from "zod";
import {
  getAllObserverNotes,
  addObserverNote,
  getObserverNotesByPetId as getObserverNotesByPetIdService,
  ObserverNote,
} from "../services/observerNoteService.js";
import {
  ObserverNoteCreateSchema,
  ObserverNoteSchema,
} from "../models/ObserverNote.schema.js";

export function listObserverNotes(req: Request, res: Response) {
  res.json({ success: true, observerNotes: getAllObserverNotes() });
}

export function getObserverNotesByPetId(req: Request, res: Response) {
  const petIdParam = req.params.petId;
  const petId = typeof petIdParam === "string" ? parseInt(petIdParam) : NaN;
  if (isNaN(petId)) {
    return res.status(400).json({ error: "Invalid pet ID" });
  }
  res.json({
    success: true,
    observerNotes: getObserverNotesByPetIdService(petId),
  });
}

export function uploadObserverNote(req: Request, res: Response) {
  const parseResult = ObserverNoteCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: z.treeifyError(parseResult.error) });
  }

  const { content, author, petId } = parseResult.data;
  const newObserverNote: ObserverNote = {
    id: 0, // set later.
    timestamp: new Date(),
    status: "active",
    content,
    author,
    petId,
  };

  ObserverNoteSchema.parse(newObserverNote);

  addObserverNote(newObserverNote);

  res.json({
    success: true,
    message: "Observer note uploaded successfully",
    observerNote: newObserverNote,
  });
}
