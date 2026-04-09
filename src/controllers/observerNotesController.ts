import { Request, Response } from "express";
import { z } from "zod";
import { resolveAuthor } from "../utils/resolveAuthor.js";
import {
  getAllObserverNotes,
  addObserverNote,
  getObserverNotesByPetId as getObserverNotesByPetIdService,
  removeObserverNoteById,
  updateObserverNoteStatus,
  removeNotesByPetId,
  ObserverNote,
} from "../services/observerNoteService.js";
import {
  ObserverNoteCreateSchema,
  ObserverNoteSchema,
} from "../models/ObserverNote.schema.js";

/**
 * Retrieves a paginated list of all observer notes.
 * 
 * @param req - Express request object containing optional query parameters:
 *              `limit` (number of notes per page) and `page` (page number).
 * @param res - Express response object.
 * @returns A JSON response with success status and the list of observer notes.
 */
export async function listObserverNotes(req: Request, res: Response) {
  const limitParam = req.query.limit;
  const pageParam = req.query.page;

  const limit = typeof limitParam === "string" ? parseInt(limitParam, 10) : undefined;
  const page = typeof pageParam === "string" ? parseInt(pageParam, 10) : undefined;

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
  const observerNotes = await getAllObserverNotes(limit, resolvedPage);
  res.json({ success: true, observerNotes });
}

/**
 * Deletes an observer note by its unique identifier.
 * 
 * @param req - Express request object containing the note `id` in path parameters.
 * @param res - Express response object.
 * @returns A JSON response indicating success or an error message if the note was not found.
 */
export async function deleteObserverNote(req: Request, res: Response) {
  const idParam = req.params.id;
  const id = typeof idParam === "string" ? parseInt(idParam, 10) : NaN;
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid observer note ID" });
  }

  const removed = await removeObserverNoteById(id);
  if (!removed) {
    return res.status(404).json({ error: "Observer note not found" });
  }

  res.json({ success: true, message: "Observer note deleted" });
}

/**
 * Updates the status of an existing observer note.
 * 
 * @param req - Express request object containing the note `id` in path parameters 
 *              and the new `status` in the request body.
 * @param res - Express response object.
 * @returns A JSON response indicating success or an error message.
 */
export async function patchObserverNoteStatus(req: Request, res: Response) {
  const idParam = req.params.id;
  const id = typeof idParam === "string" ? parseInt(idParam, 10) : NaN;

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid observer note ID" });
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
    res.json({ success: true, message: "Observer note status updated" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
}

/**
 * Retrieves all observer notes associated with a specific pet ID.
 * 
 * @param req - Express request object containing the `petId` in path parameters.
 * @param res - Express response object.
 * @returns A JSON response with success status and the list of notes for the pet.
 */
export async function getObserverNotesByPetId(req: Request, res: Response) {
  const petIdParam = req.params.petId;
  const petId = typeof petIdParam === "string" ? parseInt(petIdParam) : NaN;
  if (isNaN(petId)) {
    return res.status(400).json({ error: "Invalid pet ID" });
  }
  const observerNotes = await getObserverNotesByPetIdService(petId);
  res.json({
    success: true,
    observerNotes,
  });
}

/**
 * Deletes all observer notes associated with a specific pet ID.
 * 
 * @param req - Express request object containing the `petId` in path parameters.
 * @param res - Express response object.
 * @returns A JSON response indicating success or an error if no notes were found.
 */
export async function deleteObserverNotesByPetId(req: Request, res: Response) {
  const petIdParam = req.params.petId;
  const petId = typeof petIdParam === "string" ? parseInt(petIdParam, 10) : NaN;
  if (isNaN(petId)) {
    return res.status(400).json({ error: "Invalid pet ID" });
  }

  const removed = await removeNotesByPetId(petId);
  if (!removed) {
    return res.status(404).json({ error: "No observer notes found for this pet ID" });
  }

  res.json({ success: true, message: "Observer notes deleted for pet" });
}

/**
 * Validates and uploads a new observer note.
 * 
 * @param req - Express request object containing `content`, `author`, and `petId` in the body.
 * @param res - Express response object.
 * @returns A JSON response with the created observer note or validation errors.
 */
export async function uploadObserverNote(req: Request, res: Response) {
  const parseResult = ObserverNoteCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: z.treeifyError(parseResult.error) });
  }

  const { title, content, author, petId } = parseResult.data;

  const resolvedAuthor = resolveAuthor(req, author);
  if (resolvedAuthor === null) {
    return res.status(400).json({ error: "Device accounts must provide an author name of at least 2 characters" });
  }

  const newObserverNote: ObserverNote = {
    id: 0, // set later.
    timestamp: new Date(),
    status: "RAISED",
    title,
    content,
    author: resolvedAuthor,
    petId,
  };

  ObserverNoteSchema.parse(newObserverNote);

  await addObserverNote(newObserverNote);

  res.json({
    success: true,
    message: "Observer note uploaded successfully",
    observerNote: newObserverNote,
  });
}
