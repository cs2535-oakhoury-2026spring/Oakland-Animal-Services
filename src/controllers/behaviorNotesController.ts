import { Request, Response } from "express";
import { z } from "zod";
import { resolveAuthor } from "../utils/resolveAuthor.js";


import {
  BehaviorNote,
  BehaviorNoteCreateSchema,
  BehaviorNoteSchema,
} from "../models/BehaviorNote.schema.js";
import { addBehaviorNote, getAllBehaviorNotes, removeBehaviorNoteById, removeNotesByPetId,getBehaviorNotesByPetId as _getBehaviorNotesByPetId } from "../db/behaviorNotes.js";

/**
 * Retrieves a paginated list of all behavior notes.
 * 
 * Supports optional query parameters for pagination:
 * - limit: Maximum number of notes to return (default: 10)
 * - page: Page number (default: 1)
 * 
 * @param req - Express request object with optional query parameters
 * @param res - Express response object
 * @returns JSON response with success status and array of behavior notes
 * @throws {400} Returns error if limit or page parameters are invalid
 */
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

/**
 * Deletes a specific behavior note by its ID.
 * 
 * @param req - Express request object with id parameter in route params
 * @param res - Express response object
 * @returns JSON response with success status and confirmation message
 * @throws {400} Returns error if note ID is invalid
 * @throws {404} Returns error if behavior note is not found
 */
export async function deleteBehaviorNote(req: Request, res: Response) {
  const idParam = req.params.id;
  const id = typeof idParam === "string" ? parseInt(idParam, 10) : NaN;
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid observer note ID" });
  }

  const removed = await removeBehaviorNoteById(id);
  if (!removed) {
    return res.status(404).json({ error: "Behavior note not found" });
  }

  res.json({ success: true, message: "Behavior note deleted" });
}



/**
 * Retrieves all behavior notes associated with a specific pet.
 * 
 * @param req - Express request object with petId parameter in route params
 * @param res - Express response object
 * @returns JSON response with success status and array of behavior notes for the pet
 * @throws {400} Returns error if pet ID is invalid
 */
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

/**
 * Deletes all behavior notes associated with a specific pet.
 * 
 * @param req - Express request object with petId parameter in route params
 * @param res - Express response object
 * @returns JSON response with success status and confirmation message
 * @throws {400} Returns error if pet ID is invalid
 * @throws {404} Returns error if no behavior notes found for the pet
 */
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

  res.json({ success: true, message: "Behavior notes deleted for pet" });
}

/**
 * Creates and uploads a new behavior note.
 * 
 * Validates the request body against BehaviorNoteCreateSchema before creating the note.
 * The note is automatically timestamped with the current date/time.
 * 
 * @param req - Express request object with behavior note data in body
 * @param res - Express response object
 * @returns JSON response with success status, message, and the created behavior note
 * @throws {400} Returns error if request body validation fails
 */
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

  res.json({
    success: true,
    message: "Behavior note uploaded successfully",
    behaviorNote: newBehaviorNote,
  });
}
