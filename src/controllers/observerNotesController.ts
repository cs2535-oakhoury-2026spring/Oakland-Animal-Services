import { Request, Response } from "express";
import {
  getAllNotes,
  addNote,
  ObserverNote,
} from "../services/observerNoteService.js";
import {
  ObserverNoteCreateSchema,
  ObserverNoteSchema,
} from "../models/ObserverNote.schema.js";

export function listObserverNotes(req: Request, res: Response) {
  res.json({ success: true, observerNotes: getAllNotes() });
}

export function uploadObserverNote(req: Request, res: Response) {

  const parseResult = ObserverNoteCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.format() });
  }

  const { content, author } = parseResult.data;
  const newNote: ObserverNote = {
    timestamp: new Date(),
    content,
    author,
  };

  ObserverNoteSchema.parse(newNote);

  addNote(newNote);

  res.json({ success: true, message: "Observer note uploaded successfully", observerNote: newNote });
}
