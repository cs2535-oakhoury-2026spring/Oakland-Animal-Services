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
  getAllObserverNotes,
  addObserverNote,
  getObserverNoteById as getObserverNoteByIdService,
  getObserverNotesByPetId as getObserverNotesByPetIdService,
  removeObserverNoteById,
  updateObserverNoteStatus,
  updateObserverNoteStaffComment,
  removeNotesByPetId,
} from "../services/observerNoteService.js";
import {
  ObserverNoteCreateSchema,
  type ObserverNote,
  ObserverNoteSchema,
} from "../models/ObserverNote.schema.js";

export async function listObserverNotes(req: Request, res: Response) {
  const limit = parsePositiveIntQuery(req.query.limit);
  const page = parsePositiveIntQuery(req.query.page);
  const validationError = validatePagingParameters(limit, page);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const resolvedPage = limit != null && page == null ? 1 : page;
  const observerNotes = await getAllObserverNotes(limit, resolvedPage);
  res.json({ success: true, observerNotes });
}

export async function deleteObserverNote(req: Request, res: Response) {
  const id = parsePositiveIntParam(req.params.id);
  if (isNaN(id)) {
    return invalidIdResponse(res, "observer note");
  }

  const note = await getObserverNoteByIdService(id);
  const removed = await removeObserverNoteById(id);
  if (!removed) {
    return res.status(404).json({ error: "Observer note not found" });
  }

  logActivity({
    tag: "observerNote",
    actor: req.user!.username,
    action: "DELETED",
    jsonData: note
      ? {
          noteId: id,
          petId: note.petId,
          content: note.content,
          status: note.status,
        }
      : { noteId: id },
  });

  res.json({ success: true, message: "Observer note deleted" });
}

export async function patchObserverNoteStatus(req: Request, res: Response) {
  const id = parsePositiveIntParam(req.params.id);

  if (isNaN(id)) {
    return invalidIdResponse(res, "observer note");
  }

  const { status } = req.body;
  if (typeof status !== "string" || status.trim() === "") {
    return res.status(400).json({ error: "Invalid or missing status" });
  }

  try {
    const updated = await updateObserverNoteStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: "Observer note not found" });
    }

    const note = await getObserverNoteByIdService(id);
    const jsonData = note
      ? { noteId: id, status, petId: note.petId, content: note.content }
      : { noteId: id, status };

    logActivity({
      tag: "observerNote",
      actor: req.user!.username,
      action: "STATUS_CHANGED",
      jsonData,
    });

    res.json({ success: true, message: "Observer note status updated" });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function patchObserverNoteStaffComment(
  req: Request,
  res: Response,
) {
  const id = parsePositiveIntParam(req.params.id);

  if (isNaN(id)) {
    return invalidIdResponse(res, "observer note");
  }

  const { comment } = req.body;
  if (typeof comment !== "string" || comment.trim() === "") {
    return res.status(400).json({ error: "Invalid or missing comment" });
  }

  try {
    const updated = await updateObserverNoteStaffComment(
      id,
      comment.trim(),
      req.user!.username,
    );

    if (!updated) {
      return res.status(404).json({ error: "Observer note not found" });
    }

    const note = await getObserverNoteByIdService(id);
    const jsonData = note
      ? {
          noteId: id,
          petId: note.petId,
          content: note.content,
          comment,
        }
      : { noteId: id, comment };

    logActivity({
      tag: "observerNote",
      actor: req.user!.username,
      action: "STAFF_COMMENT_UPDATED",
      jsonData,
    });

    return res.json({ success: true, message: "Observer note staff comment updated" });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getObserverNotesByPetId(req: Request, res: Response) {
  const petId = parsePositiveIntParam(req.params.petId);
  if (isNaN(petId)) {
    return invalidIdResponse(res, "pet");
  }
  const observerNotes = await getObserverNotesByPetIdService(petId);
  res.json({ success: true, observerNotes });
}

export async function deleteObserverNotesByPetId(req: Request, res: Response) {
  const petId = parsePositiveIntParam(req.params.petId);
  if (isNaN(petId)) {
    return invalidIdResponse(res, "pet");
  }

  const removed = await removeNotesByPetId(petId);
  if (!removed) {
    return res
      .status(404)
      .json({ error: "No observer notes found for this pet ID" });
  }

  logActivity({
    tag: "observerNote",
    actor: req.user!.username,
    action: "BULK_DELETED",
    jsonData: { petId },
  });

  res.json({ success: true, message: "Observer notes deleted for pet" });
}

export async function uploadObserverNote(req: Request, res: Response) {
  const parseResult = ObserverNoteCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: z.treeifyError(parseResult.error) });
  }

  const { title, content, author, petId, status } = parseResult.data;

  const resolvedAuthor = resolveAuthor(req, author);
  if (resolvedAuthor === null) {
    return res.status(400).json({
      error:
        "Device accounts must provide an author name of at least 2 characters",
    });
  }

  const newObserverNote: ObserverNote = {
    id: 0, // set later.
    // noteType is assigned in the repository layer.
    timestamp: new Date(),
    status: status ?? "RAISED",
    title,
    content,
    author: resolvedAuthor,
    petId,
  };

  ObserverNoteSchema.parse(newObserverNote);

  const createdId = await addObserverNote(newObserverNote);
  if (!createdId) {
    return res.status(500).json({ error: "Failed to create observer note" });
  }
  newObserverNote.id = createdId;

  logActivity({
    tag: "observerNote",
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
    message: "Observer note uploaded successfully",
    observerNote: newObserverNote,
  });
}
