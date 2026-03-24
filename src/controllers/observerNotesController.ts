import { Request, Response } from "express";
import { ObservationNotesRepository } from "../models/repositories/ObservationNotesRepository.js";
import { StaffObservationService } from "../models/services/StaffObservationService.js";
import { VetObservationService } from "../models/services/VetObservationService.js";

const repository = new ObservationNotesRepository();
const staffService = new StaffObservationService(repository);
const vetService = new VetObservationService(repository);

/**
 * Creates a new medical observation note for a pet.
 * 
 * @param req - Express request object containing `petId` in params and `noteContent`, `caseTitle`, `reportedBy` in body.
 * @param res - Express response object used to send the created note or an error message.
 */
export async function createMedicalNote(req: Request, res: Response) {
  try {
    const { petId } = req.params;
    const { noteContent, caseTitle, reportedBy } = req.body;
    const note = await staffService.createMedicalNote({
      animalId: petId,
      noteType: "MEDICAL",
      noteContent,
      caseTitle,
      reportedBy,
      dateReported: new Date(),
    });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: "Failed to create medical note" });
  }
}

/**
 * Creates a new behavioral observation note for a pet.
 * 
 * @param req - Express request object containing `petId` in params and `noteContent`, `reportedBy` in body.
 * @param res - Express response object used to send the created note or an error message.
 */
export async function createBehavioralNote(req: Request, res: Response) {
  try {
    const { petId } = req.params;
    const { noteContent, reportedBy } = req.body;
    const note = await staffService.createBehavioralNote({
      animalId: petId,
      noteType: "BEHAVIOR",
      noteContent,
      reportedBy,
      dateReported: new Date(),
    });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: "Failed to create behavioral note" });
  }
}

/**
 * Retrieves all observation notes associated with a specific animal ID.
 * 
 * @param req - Express request object containing `petId` in params.
 * @param res - Express response object used to send the list of notes or an error message.
 */
export async function getNotesByAnimalId(req: Request, res: Response) {
  try {
    const { petId } = req.params as { petId: string };
    const notes = await staffService.getNotesByAnimalId(petId);
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
}

/**
 * Retrieves all observation notes reported on a specific date.
 * 
 * @param req - Express request object containing `date` in query parameters.
 * @param res - Express response object used to send the list of notes or an error message.
 */
export async function getNotesByDate(req: Request, res: Response) {
  try {
    const { date } = req.query;
    const notes = await staffService.getNotesByDate(new Date(date as string));
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notes by date" });
  }
}

/**
 * Resolves an existing medical note, typically used when a veterinarian addresses a reported case.
 * 
 * @param req - Express request object containing `petId` in params and `sk` (Sort Key), `resolvedBy` in body.
 * @param res - Express response object used to send the updated note or an error message.
 */
export async function resolveMedicalNote(req: Request, res: Response) {
  try {
    const petId = req.params.petId as string;
    const { sk, resolvedBy } = req.body;
    const result = await vetService.resolveMedicalNote(petId, sk, resolvedBy);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to resolve medical note" });
  }
}
