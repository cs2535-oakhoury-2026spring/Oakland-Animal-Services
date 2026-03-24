import { BehavioralNote } from "../BehavioralNote.js";
import { ObservationNote } from "../ObservationNote.js";
import { MedicalObservationNote } from "../MedicalObservationNote.js";
import { ObservationNotesRepository } from "../repositories/ObservationNotesRepository.js";
import logger from "../../utils/logger.js";

export class StaffObservationService {
    protected observationNotesRepository: ObservationNotesRepository;

    constructor(observationNotesRepository: ObservationNotesRepository) {
        this.observationNotesRepository = observationNotesRepository;
    }

    /**
     * Takes in raw inputs from the staff and creates a behavioral note and passes it to the repository for storage.
     * @param data - The raw behavioral note data to be created.
     * @returns A promise that resolves to the created behavioral note.
     */
    async createBehavioralNote(data: any): Promise<BehavioralNote> {
        logger.info(`Creating behavioral note for animal: ${data.animalId}`);
        try {
            const note = new BehavioralNote(data);
            const result = await this.observationNotesRepository.createBehavorialNote(note);
            logger.info(`Successfully created behavioral note for animal: ${data.animalId}`);
            return result;
        } catch (error) {
            logger.error(`Failed to create behavioral note for animal: ${data.animalId}`, error);
            throw error;
        }
    }

    /**
     * Takes in raw inputs from the staff and creates a medical note and passes it to the repository for storage.
     * @param data - The raw medical note data to be created.
     * @returns A promise that resolves to the created medical note.
     */
    async createMedicalNote(data: any): Promise<MedicalObservationNote> {
        logger.info(`Creating medical note for animal: ${data.animalId}`);
        try {
            const note = new MedicalObservationNote(data);
            const result = await this.observationNotesRepository.createMedicalNote(note);
            logger.info(`Successfully created medical note for animal: ${data.animalId}`);
            return result;
        } catch (error) {
            logger.error(`Failed to create medical note for animal: ${data.animalId}`, error);
            throw error;
        }
    }

    /**
     * Takes in a date and returns all notes for that date.
     * @param date - The date for which to retrieve notes.
     * @returns A promise that resolves to an array of observation notes for the specified date.
     */
    async getNotesByDate(date: Date): Promise<ObservationNote[]> {
        const dateString = date.toISOString().split("T")[0];
        logger.info(`Fetching observation notes for date: ${dateString}`);
        try {
            const result = await this.observationNotesRepository.getNotesByDate(dateString);
            logger.info(`Successfully fetched ${result.length} notes for date: ${dateString}`);
            return result;
        } catch (error) {
            logger.error(`Failed to fetch observation notes for date: ${dateString}`, error);
            throw error;
        }
    }

    /**
     * Takes in an animal ID and returns all notes for that animal.
     * @param animalId - The ID of the animal for which to retrieve notes.
     * @returns A promise that resolves to an array of observation notes for the specified animal.
     */
    async getNotesByAnimalId(animalId: string): Promise<ObservationNote[]> {
        logger.info(`Fetching observation notes for animal ID: ${animalId}`);
        try {
            const result = await this.observationNotesRepository.getNotesByAnimalId(animalId);
            logger.info(`Successfully fetched ${result.length} notes for animal ID: ${animalId}`);
            return result;
        } catch (error) {
            logger.error(`Failed to fetch observation notes for animal ID: ${animalId}`, error);
            throw error;
        }
    }
}
