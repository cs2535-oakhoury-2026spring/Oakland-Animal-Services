import { z } from "zod";
import { MedicalNoteSchema } from "./schemas/ObservationNote.schema.js";
import { ObservationNote } from "./ObservationNote.js";

type MedicalNoteData = z.infer<typeof MedicalNoteSchema>;

export class MedicalObservationNote extends ObservationNote {
  noteType: "MEDICAL";
  caseTitle: string;
  status: "RAISED" | "RESOLVED";
  resolvedAt: Date | null;
  resolvedBy: string | null;

  /**
   * Creates an instance of MedicalObservationNote.
   * @param data - The data used to initialize the medical observation note, validated against MedicalNoteSchema.
   */
  constructor(data: MedicalNoteData) {
    const parsed = MedicalNoteSchema.parse(data);
    super({
      animalId: parsed.animalId,
      dateReported: parsed.dateReported,
      reportedBy: parsed.reportedBy,
      noteContent: parsed.noteContent,
    });
    this.noteType = parsed.noteType;
    this.caseTitle = parsed.caseTitle;
    this.status = parsed.status;
    this.resolvedAt = parsed.resolvedAt;
    this.resolvedBy = parsed.resolvedBy;
  }

  /**
   * Creates a MedicalObservationNote instance from a DynamoDB record.
   * @param record - The raw data record retrieved from DynamoDB.
   * @returns A new MedicalObservationNote instance populated with data from the DynamoDB record.
   */
  static fromDynamoDB(record: any): MedicalObservationNote {
    const data = {
      ...record,
      dateReported: new Date(record.dateReported),
      ResolvedAt: record.ResolvedAt ? new Date(record.ResolvedAt) : null,
    };
    return new MedicalObservationNote(data);
  }

  /**
   * Converts the medical observation note instance into a format suitable for storage in DynamoDB.
   * Includes the primary key (PK), sort key (SK), and specific medical note fields.
   * @returns A record object representing the medical observation note in DynamoDB format.
   */
  toDynamoDB(): Record<string, any> {
    return {
      PK: `${this.animalId}`,
      SK: `${this.noteType}#${this.dateReported.toISOString()}`,
      dateKey: this.dateReported.toISOString().split("T")[0],
      noteType: this.noteType,
      animalId: this.animalId,
      dateReported: this.dateReported.toISOString(),
      reportedBy: this.reportedBy,
      noteContent: this.noteContent,
      caseTitle: this.caseTitle,
      status: this.status,
      resolvedAt: this.resolvedAt ? this.resolvedAt.toISOString() : null,
      resolvedBy: this.resolvedBy,
    };
  }

  /**
   * Generates a DynamoDB update operation object to resolve a medical observation note.
   * @param resolvedBy - The identifier of the user who resolved the note.
   * @returns An object containing the Key, ConditionExpression, UpdateExpression, and Attribute mappings for the DynamoDB update.
   */
  updateResolveStatus(resolvedBy: string) {
    return{
      Key : {
        PK: `${this.animalId}`,
        SK: `${this.noteType}#${this.dateReported.toISOString()}`,
      },
      ConditionExpression : "#status = :raised",
      UpdateExpression: "SET #status = :resolved, resolvedBy = :resolvedBy, resolvedAt = :resolvedAt",
      ExpressionAttributeNames: {
        "#status" : "status"
      },
      ExpressionAttributeValues: {
        ":raised" : "RAISED",
        ":resolved": "RESOLVED",
        ":resolvedAt": new Date().toISOString(),
        ":resolvedBy": resolvedBy,
      }
    }
  }
}
