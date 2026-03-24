import { MedicalObservationNote } from "../MedicalObservationNote.js";
import { ObservationNotesRepository } from "../repositories/ObservationNotesRepository.js";
import { StaffObservationService } from "./StaffObservationService.js";
import logger from "../../utils/logger.js";

export class VetObservationService extends StaffObservationService {

    constructor(observationNotesRepository: ObservationNotesRepository) {
        super(observationNotesRepository);
    }

    /**
     * Takes a medical note and resolves it.
     * @param animalId - The animal rescueId
     * @param sk - The sort key of the note
     * @param resolvedBy - The identifier of the vet who resolved the note.
     * @returns A promise that resolves to the resolved medical note.
     */
    async resolveMedicalNote(animalId: string, sk: string, resolvedBy: string): Promise<{Status: string, ResolvedAt: Date, ResolvedBy: string}> {
        logger.info(`Resolving medical note for animal: ${animalId} by: ${resolvedBy}`);
        try {
            const result = await this.observationNotesRepository.resolveMedicalNote(animalId, sk, resolvedBy);
            logger.info(`Successfully resolved medical note for animal: ${animalId} by: ${resolvedBy}`);
            return result;
        } catch (error) {
            logger.error(`Failed to resolve medical note for animal: ${animalId} by: ${resolvedBy}`, error);
            throw error;
        }
    }
}
