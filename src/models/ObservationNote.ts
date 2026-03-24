import { z } from "zod";
import { ObservationNoteSchema } from "./schemas/ObservationNote.schema.js";

type ObservationNoteData = z.infer<typeof ObservationNoteSchema>;

export abstract class ObservationNote {
  animalId: string;
  dateReported: Date;
  reportedBy: string;
  noteContent: string;

  /**
   * Creates an instance of ObservationNote.
   * @param data - The data used to initialize the observation note, validated against ObservationNoteSchema.
   */
  constructor(data: ObservationNoteData) {
    this.animalId = data.animalId;
    this.dateReported = data.dateReported;
    this.reportedBy = data.reportedBy;
    this.noteContent = data.noteContent;
  }
  
  /**
   * Converts the observation note instance into a format suitable for storage in DynamoDB.
   * @returns A record object representing the observation note in DynamoDB format.
   */
  abstract toDynamoDB(): Record<string, any>;
}
