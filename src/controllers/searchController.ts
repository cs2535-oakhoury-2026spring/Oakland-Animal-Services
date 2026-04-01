import { Request, Response } from "express";
import {
  findSimilarObserverNotes,
  SimilarNoteResult,
} from "../services/observerNoteService.js";
import { number } from "zod";

/**
 * Performs a search for similar observer notes based on content and optional filters.
 * 
 * @param req - Express request object containing `query` (required), `nameToExclude`, 
 *              `maxResults`, `petId`, and `page` in the request body.
 * @param res - Express response object.
 * @returns A JSON response with the search results and metadata.
 */
export async function search(req: Request, res: Response) {
  const {
    query: observerNoteContent,
    nameToExclude,
    maxResults,
    petId,
    page,
  } = req.body;

  if (!observerNoteContent) {
    return res.status(400).json({ error: "Search query is required" });
  }

  const parsedPetId =
    petId == null
      ? undefined
      : typeof petId === "string"
      ? Number(petId)
      : petId;

  if (parsedPetId != null && Number.isNaN(parsedPetId)) {
    return res.status(400).json({ error: "petId must be a valid number" });
  }

  const parsedMaxResults =
    maxResults == null
      ? undefined
      : typeof maxResults === "string"
      ? Number(maxResults)
      : maxResults;

  if (parsedMaxResults != null && (Number.isNaN(parsedMaxResults) || parsedMaxResults <= 0)) {
    return res.status(400).json({ error: "maxResults must be a positive number" });
  }

  const parsedPage =
    page == null
      ? undefined
      : typeof page === "string"
      ? Number(page)
      : page;

  if (parsedPage != null && (Number.isNaN(parsedPage) || parsedPage <= 0)) {
    return res.status(400).json({ error: "page must be a positive number" });
  }

  try {
    const results: SimilarNoteResult[] = await findSimilarObserverNotes(
      observerNoteContent,
      {
        nameToExclude,
        maxResults: parsedMaxResults,
        petId: parsedPetId,
        page: parsedPage,
      },
    );
    res.json({
      success: true,
      query: observerNoteContent,
      results,
      resultCount: results.length,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
  }
}
