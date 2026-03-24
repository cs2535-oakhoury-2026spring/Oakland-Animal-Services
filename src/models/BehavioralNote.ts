import { BehavioralNoteSchema } from "./schemas/ObservationNote.schema.js";
import { ObservationNote } from "./ObservationNote.js";

export class BehavioralNote extends ObservationNote {
  noteType: "BEHAVIOR" = "BEHAVIOR";

  /**
   * Creates an instance of BehavioralNote.
   * @param data - The data used to initialize the behavioral note, validated against BehavioralNoteSchema.
   */
  constructor(data: any) {
    const parsed = BehavioralNoteSchema.parse(data);
    super(parsed);
    this.noteType = parsed.noteType;
  }

  /**
   * Converts the behavioral note instance into a format suitable for storage in DynamoDB.
   * Includes the primary key (PK) and sort key (SK) for DynamoDB.
   * @returns A record object representing the behavioral note in DynamoDB format.
   */
  override toDynamoDB() {
    return {
      PK: `${this.animalId}`,
      SK: `${this.noteType}#${this.dateReported.toISOString()}`,
      dateKey: this.dateReported.toISOString().split("T")[0],
      noteType: this.noteType,
      animalId: this.animalId,
      dateReported: this.dateReported.toISOString(),
      reportedBy: this.reportedBy,
      noteContent: this.noteContent,
    };
  }

  /**
   * Creates a BehavioralNote instance from a DynamoDB record.
   * @param record - The raw data record retrieved from DynamoDB.
   * @returns A new BehavioralNote instance populated with data from the DynamoDB record.
   */
  static fromDynamoDB(record: any): BehavioralNote {
    const data = {
      ...record,
      dateReported: new Date(record.dateReported),
    };
    return new BehavioralNote(data);
  }
}
