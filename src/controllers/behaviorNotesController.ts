import { Request, Response } from "express";
import { z } from "zod";
import { resolveAuthor } from "../utils/resolveAuthor.js";
import { logActivity } from "../utils/logActivity.js";
import {
  invalidIdResponse,
  parsePositiveIntParam,
  parsePositiveIntQuery,
  validatePagingParameters,
} from "../utils/noteControllerUtils.js";

import {
  BehaviorNote,
  BehaviorNoteCreateSchema,
  BehaviorNoteSchema,
} from "../models/BehaviorNote.schema.js";
import {
  addBehaviorNote,
  getAllBehaviorNotes,
  getBehaviorNoteById,
  removeBehaviorNoteById,
  removeNotesByPetId,
  getBehaviorNotesByPetId as getBehaviorNotesByPetIdService,
} from "../services/behaviorNoteService.js";

export async function listBehaviorNotes(req: Request, res: Response) {
  const limit = parsePositiveIntQuery(req.query.limit);
  const page = parsePositiveIntQuery(req.query.page);
  const validationError = validatePagingParameters(limit, page);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const resolvedPage = limit != null && page == null ? 1 : page;
  const behaviorNotes = await getAllBehaviorNotes(
    limit ?? 10,
    resolvedPage ?? 1,
  );
  res.json({ success: true, behaviorNotes });
}

export async function deleteBehaviorNote(req: Request, res: Response) {
  const id = parsePositiveIntParam(req.params.id);
  if (isNaN(id)) {
    return invalidIdResponse(res, "behavior note");
  }

  const note = await getBehaviorNoteById(id);
  const removed = await removeBehaviorNoteById(id);
  if (!removed) {
    return res.status(404).json({ error: "Behavior note not found" });
  }

  logActivity({
    tag: "behaviorNote",
    actor: req.user!.username,
    action: "DELETED",
    jsonData: note
      ? { noteId: id, petId: note.petId, content: note.content }
      : { noteId: id },
  });

  res.json({ success: true, message: "Behavior note deleted" });
}

export async function getBehaviorNotesByPetId(req: Request, res: Response) {
  const petId = parsePositiveIntParam(req.params.petId);
  if (isNaN(petId)) {
    return invalidIdResponse(res, "pet");
  }

  const behaviorNotes = await getBehaviorNotesByPetIdService(petId);
  res.json({ success: true, behaviorNotes });
}

export async function deleteBehaviorNotesByPetId(req: Request, res: Response) {
  const petId = parsePositiveIntParam(req.params.petId);
  if (isNaN(petId)) {
    return invalidIdResponse(res, "pet");
  }

  const removed = await removeNotesByPetId(petId);
  if (!removed) {
    return res
      .status(404)
      .json({ error: "No behavior notes found for this pet ID" });
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
    return res.status(400).json({
      error:
        "Device accounts must provide an author name of at least 2 characters",
    });
  }

  const newBehaviorNote: BehaviorNote = {
    id: 0, // set later.
    // noteType is assigned in the repository layer.
    timestamp: new Date(),
    title,
    content,
    author: resolvedAuthor,
    petId,
  };

  BehaviorNoteSchema.parse(newBehaviorNote);

  const createdId = await addBehaviorNote(newBehaviorNote);
  if (!createdId) {
    return res.status(500).json({ error: "Failed to create behavior note" });
  }
  newBehaviorNote.id = createdId;

  logActivity({
    tag: "behaviorNote",
    actor: resolvedAuthor,
    action: "CREATED",
    jsonData: {
      petId,
      content,
      author: resolvedAuthor,
      username: req.user!.username,
    },
  });

  res.json({
    success: true,
    message: "Behavior note uploaded successfully",
    behaviorNote: newBehaviorNote,
  });
}
