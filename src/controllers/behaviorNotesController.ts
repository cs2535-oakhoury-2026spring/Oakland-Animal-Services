import { Request, Response } from "express";
import { z } from "zod";
import { resolveAuthor } from "../utils/resolveAuthor.js";
import { logActivity } from "../utils/logActivity.js";

import {
  BehaviorNote,
  BehaviorNoteCreateSchema,
  BehaviorNoteSchema,
} from "../models/BehaviorNote.schema.js";
import { addBehaviorNote, getAllBehaviorNotes, removeBehaviorNoteById, removeNotesByPetId,getBehaviorNotesByPetId as _getBehaviorNotesByPetId } from "../db/behaviorNotes.js";

export async function listBehaviorNotes(req: Request, res: Response) {
  const limitParam = req.query.limit;
  const pageParam = req.query.page;

  const limit = typeof limitParam === "string" ? parseInt(limitParam, 10) : null;
  const page = typeof pageParam === "string" ? parseInt(pageParam, 10) : null;

  if ((limit != null && isNaN(limit)) || (page != null && isNaN(page))) {
    return res.status(400).json({ error: "limit and page must be integers" });
  }

  if (limit != null && limit <= 0) {
    return res.status(400).json({ error: "limit must be a positive number" });
  }

  if (page != null && page <= 0) {
    return res.status(400).json({ error: "page must be a positive number" });
  }

  if (page != null && limit == null) {
    return res.status(400).json({ error: "limit is required when paging by page" });
  }

  const resolvedPage = limit != null && page == null ? 1 : page;
  const behaviorNotes = await getAllBehaviorNotes(limit ?? 10, resolvedPage ?? 1);
  res.json({ success: true, behaviorNotes });
}

export async function deleteBehaviorNote(req: Request, res: Response) {
  const idParam = req.params.id;
  const id = typeof idParam === "string" ? parseInt(idParam, 10) : NaN;
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid behavior note ID" });
  }

  const removed = await removeBehaviorNoteById(id);
  if (!removed) {
    return res.status(404).json({ error: "Behavior note not found" });
  }

  logActivity({
    tag: "behaviorNote",
    actor: req.user!.username,
    action: "DELETED",
    jsonData: { noteId: id },
  });

  res.json({ success: true, message: "Behavior note deleted" });
}

export async function getBehaviorNotesByPetId(req: Request, res: Response) {
  const petIdParam = req.params.petId;
  const petId = typeof petIdParam === "string" ? parseInt(petIdParam) : NaN;
  if (isNaN(petId)) {
    return res.status(400).json({ error: "Invalid pet ID" });
  }
  const behaviorNotes = await _getBehaviorNotesByPetId(petId);
  res.json({
    success: true,
    behaviorNotes,
  });
}

export async function deleteBehaviorNotesByPetId(req: Request, res: Response) {
  const petIdParam = req.params.petId;
  const petId = typeof petIdParam === "string" ? parseInt(petIdParam, 10) : NaN;
  if (isNaN(petId)) {
    return res.status(400).json({ error: "Invalid pet ID" });
  }

  const removed = await removeNotesByPetId(petId);
  if (!removed) {
    return res.status(404).json({ error: "No behavior notes found for this pet ID" });
  }

  logActivity({
    tag: "behaviorNote",
    actor: req.user!.username,
    action: "BULK_DELETED",
    jsonData: { petId },
  });

  res.json({ success: true, message: "Behavior notes deleted for pet" });
}

export async function uploadBehaviorNote(req: Request, res: Response) {
  const parseResult = BehaviorNoteCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: z.treeifyError(parseResult.error) });
  }

  const { title, content, author, petId } = parseResult.data;

  const resolvedAuthor = resolveAuthor(req, author);
  if (resolvedAuthor === null) {
    return res.status(400).json({ error: "Device accounts must provide an author name of at least 2 characters" });
  }

  const newBehaviorNote: BehaviorNote = {
    id: 0, // set later.
    timestamp: new Date(),
    title,
    content,
    author: resolvedAuthor,
    petId,
  };

  BehaviorNoteSchema.parse(newBehaviorNote);

  await addBehaviorNote(newBehaviorNote);

  logActivity({
    tag: "behaviorNote",
    actor: req.user!.username,
    action: "CREATED",
    jsonData: { petId, content },
  });

  res.json({
    success: true,
    message: "Behavior note uploaded successfully",
    behaviorNote: newBehaviorNote,
  });
}
