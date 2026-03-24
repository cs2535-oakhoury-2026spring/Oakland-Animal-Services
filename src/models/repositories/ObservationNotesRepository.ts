import {dbDocumentClient} from "../../config/index.js";
import {MedicalObservationNote} from "../MedicalObservationNote.js";
import {ObservationNote} from "../ObservationNote.js";
import {BehavioralNote} from "../BehavioralNote.js";
import {PutCommand, QueryCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import { z } from "zod";

const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").transform((s) => new Date(s));

/**
 * Repository for reading and writing observation notes (medical and behavorial)
 * to the DynamoDB "ObservationNotes" table.
 */
export class ObservationNotesRepository {
    private dbClient = dbDocumentClient;
    private TABLE_NAME = "ObservationNotes";


    /**
     * Adds a medical observation note to the database.
     * @param note - The medical note to insert
     * @returns The inserted note
     * @throws {Error} if the DynamoDB write fails
     */
    async createMedicalNote(note: MedicalObservationNote): Promise<MedicalObservationNote> {
        await this.dbClient.send(new PutCommand({
            TableName: this.TABLE_NAME,
            Item: note.toDynamoDB(),
        }));
        return note;
    }

    /**
     * Adds a behavorial observation note to the database.
     * @param note - The behavorial note to insert
     * @returns The inserted note
     * @throws {Error} if the DynamoDB write fails
     */
    async createBehavorialNote(note: BehavioralNote): Promise<BehavioralNote> {
        await this.dbClient.send(new PutCommand({
            TableName: this.TABLE_NAME,
            Item: note.toDynamoDB(),
        }));
        return note;
    }


    /**
     * Returns all observation notes (medical or behavioral) reported on a given date.
     * @param dateString - The date to filter by in "YYYY-MM-DD" format
     * @returns An array of matching observation notes
     * @throws {Error} if the DynamoDB query fails
     */
    async getNotesByDate(dateString: string): Promise<ObservationNote[]> {
        const date = DateStringSchema.parse(dateString);
        const datePrefix = date.toISOString().split("T")[0]; // YYYY-MM-DD
        const result = await this.dbClient.send(new QueryCommand({
            TableName : this.TABLE_NAME,
            IndexName : "ByDate",
            KeyConditionExpression : "dateKey = :datePrefix",
            ExpressionAttributeValues : {
                ":datePrefix" : datePrefix
            }
        }));

        return (result.Items ?? []).map((item: Record<string, any>) => {
            if (item.noteType === "MEDICAL") {
                return MedicalObservationNote.fromDynamoDB(item);
            }
            return BehavioralNote.fromDynamoDB(item);
        });
    }

    /**
     * Returns all observation notes (medical or behavioral) for a given animal.
     * @param animalId - The animal rescueId
     * @returns An array of matching observation notes
     * @throws {Error} if the DynamoDB query fails
     */
    async getNotesByAnimalId(animalId: string): Promise<ObservationNote[]> {
        const result = await this.dbClient.send(new QueryCommand({
            TableName: this.TABLE_NAME,
            KeyConditionExpression: "PK = :animalId",
            ExpressionAttributeValues: {
                ":animalId": animalId,
            },
        }));

        return (result.Items ?? []).map((item: Record<string, any>) => {
            if (item.noteType === "MEDICAL") {
                return MedicalObservationNote.fromDynamoDB(item);
            }
            return BehavioralNote.fromDynamoDB(item);
        });
    }

    /**
     * Resolves a medical note whose status is RAISED.
     * @param animalId - The animal rescueId
     * @param sk - The sort key of the note
     * @param resolvedBy - The name or ID of the vet resolving the note
     * @returns The updated note with status set to RESOLVED
     * @throws {Error} if the note is not in RAISED status or the DynamoDB update fails
     */
    async resolveMedicalNote(animalId: string, sk: string, resolvedBy: string) {
        const updateParams = {
            Key: {
                PK: animalId,
                SK: sk
            },
            ConditionExpression: "#status = :raised",
            UpdateExpression: "SET #status = :resolved, resolvedBy = :resolvedBy, resolvedAt = :resolvedAt",
            ExpressionAttributeNames: {
                "#status": "status",
            },
            ExpressionAttributeValues: {
                ":raised": "RAISED",
                ":resolved": "RESOLVED",
                ":resolvedBy": resolvedBy,
                ":resolvedAt": new Date().toISOString(),
            }
        };
        await this.dbClient.send(new UpdateCommand({
            TableName: this.TABLE_NAME,
            ...updateParams,
        }));
        return {
            Status: "RESOLVED",
            ResolvedAt: new Date(),
            ResolvedBy: resolvedBy
        };
    }
}
