import {
  type ObserverNote,
} from "../../models/ObserverNote.schema.js";
import { ObserverNoteRepository } from "../../types/index.js";
import { PutCommand, QueryCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../config/index.js";
const TABLE_NAME = "Notes";
const NOTE_TYPE = "OBSERVER";

/**
 * Repository for observer notes stored in the merged Notes table.
 *
 * All reads and writes are constrained to items whose noteType is OBSERVER.
 * The API layer does not provide noteType; it is assigned here so observer
 * notes stay isolated from behavior notes inside the shared table.
 */

export class ObserverNoteDBRepository implements ObserverNoteRepository {
  /**
   * Retrieves all observer notes with optional pagination.
   * @param limit - Maximum number of notes to return.
   * @param page - Page number for pagination (1-indexed).
   * @returns A promise resolving to an array of ObserverNote objects.
   */
  async getObserverNotes(limit?: number, page?: number): Promise<ObserverNote[]> {
    try {
      const resolvedLimit = limit ?? 10;
      const resolvedPage = page ?? 1;
      
      let lastKey = undefined;
      
      for (let i = 1; i < resolvedPage; i++) {
        const result : any = await docClient.send(new ScanCommand({
          TableName: TABLE_NAME,
          Limit: resolvedLimit,
          FilterExpression: "noteType = :noteType",
          ExpressionAttributeValues: {
            ":noteType": NOTE_TYPE,
          },
          ExclusiveStartKey: lastKey,
        }));
        lastKey = result.LastEvaluatedKey;
        if (!lastKey) return [];
      }
      
      const pageResult = await docClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        Limit: resolvedLimit,
        FilterExpression: "noteType = :noteType",
        ExpressionAttributeValues: {
          ":noteType": NOTE_TYPE,
        },
        ExclusiveStartKey: lastKey,
      }));
      
      return (pageResult.Items ?? []) as ObserverNote[];
    } catch (error) {
      return [];
    }
  }

  /**
    * Retrieves all observer notes associated with a specific pet from Notes.
    *
    * Results are filtered to the OBSERVER noteType so behavior notes are not
    * returned even though both note kinds share the same table.
   * @param petId - The integer ID of the pet.
   * @returns A promise resolving to an array of ObserverNote objects for that pet.
   */
  async getObserverNoteByPetId(petId: number): Promise<ObserverNote[]> {
    try {
      const command = new QueryCommand(
        {
          TableName: TABLE_NAME,
          KeyConditionExpression: "petId = :petId",
          FilterExpression: "noteType = :noteType",
          ExpressionAttributeValues: {
            ":petId": petId,
            ":noteType": NOTE_TYPE,
          }
        }
      )
      const result = await docClient.send(command);
      if (!result.Items) {
        return [];
      }
      return result.Items as ObserverNote[];
    } catch (error) {
      return [];
    }
  }

  async getObserverNoteById(id: number): Promise<ObserverNote | null> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "id-index",
        KeyConditionExpression: "id = :id",
        FilterExpression: "noteType = :noteType",
        ExpressionAttributeValues: {
          ":id": id,
          ":noteType": NOTE_TYPE,
        },
      });
      const result = await docClient.send(command);
      const item = result.Items?.[0];
      return item ? (item as ObserverNote) : null;
    } catch (error) {
      return null;
    }
  }

  /**
    * Inserts a new observer note into the merged Notes table.
    *
    * The repository assigns noteType = OBSERVER before persistence so callers
    * do not need to know about the storage layout.
    * @param note - The ObserverNote object to add, including content, author, petId, timestamp, and optional status.
   * @returns A promise resolving to true if the insert succeeded, false otherwise.
   */
  async addObserverNote(note: ObserverNote): Promise<number> {
    try {
      // Generate a unique ID using timestamp and random number
      const uniqueId = note.timestamp.getTime() + Math.floor(Math.random() * 1000);
      
      // Create the item to insert with generated ID
      const item = {
        ...note,
        id: uniqueId,
        noteType: NOTE_TYPE,
        timestamp: note.timestamp.toISOString(), // Convert Date to ISO string for DynamoDB
        status: note.status ?? "RAISED", // Default status if not provided
      };

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      });

      await docClient.send(command);
      return uniqueId;
    } catch (error) {
      console.error("Error adding observer note:", error);
      return 0;
    }
  }

  /**
    * Deletes a single observer note by its ID from the merged Notes table.
    *
    * The lookup uses the id-index and filters on noteType so an unrelated note
    * with the same id cannot be removed accidentally.
   * @param uniqueId - The unique ID of the observer note to remove.
   * @returns A promise resolving to true if the deletion succeeded, false otherwise.
   */
  async removeObserverNoteById(uniqueId: number): Promise<boolean> {
    try{
      // DeleteCommand requires both Partition Key and Sort Key;
      //Therefore, we query the item first to get the sort key, then delete it

      //Step 1 : Query the item to get the sort key
        const result = await docClient.send(new QueryCommand(
          {
            TableName: TABLE_NAME,
            IndexName: "id-index",
            KeyConditionExpression: "id = :id",
            FilterExpression: "noteType = :noteType",
            ExpressionAttributeValues: {
              ":id": uniqueId,
              ":noteType": NOTE_TYPE,
            }
          }
        ));

        const item = result.Items?.[0];
        if (!item) {throw new Error("Observer note not found");}
        
        //Step 2 : Delete the item
        const deleteCommand = new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            petId: item.petId,
            timestamp: item.timestamp
          }
        });
        
        await docClient.send(deleteCommand);
      return true;
    }catch(error) {
      return false;
    }
  }

  /**
    * Updates the status field of a specific observer note in Notes.
    *
    * The note is first resolved through the id-index and filtered to OBSERVER so
    * only observer notes can be updated here.
   * @param uniqueId - The unique ID of the observer note to update.
   * @param status - The new status string to set on the note.
   * @returns A promise resolving to true if the update succeeded, false otherwise.
   */
  async updateObserverNoteStatus(uniqueId: number, status: string): Promise<boolean> {
    try {
      // Step 1: Query the item to get the partition key and sort key
      const queryCommand = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "id-index",
        KeyConditionExpression: "id = :id",
        FilterExpression: "noteType = :noteType",
        ExpressionAttributeValues: {
          ":id": uniqueId,
          ":noteType": NOTE_TYPE,
        }
      });
      
      const result = await docClient.send(queryCommand);
      const item = result.Items?.[0];
      if (!item) {throw new Error("Observer note not found");}
      
      // Step 2: Update the status
      const updateCommand = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          petId: item.petId,
          timestamp: item.timestamp
        },
        UpdateExpression: "SET #status = :status",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":status": status
        }
      });
      
      await docClient.send(updateCommand);
      return true;
    } catch (error) {
      console.error("Error updating observer note status:", error);
      return false;
    }
  }

  /**
    * Deletes all observer notes associated with a specific pet from Notes.
    *
    * Only items tagged OBSERVER are deleted.
   * @param petId - The integer ID of the pet whose notes should be removed.
   * @returns A promise resolving to true if the deletions succeeded, false otherwise.
   */
  async removeNotesByPetId(petId: number): Promise<boolean> {
    //DeleteCommand requires both Partition Key and Sort Key
    //So we query all the Items by petId and then delete each iteam by Partition and Sort Key
    try {
      const command = new QueryCommand({
        TableName : TABLE_NAME,
        KeyConditionExpression : "petId = :petId",
        FilterExpression: "noteType = :noteType",
        ExpressionAttributeValues : {
          ":petId" : petId,
          ":noteType": NOTE_TYPE,
        }
      })

      const result = await docClient.send(command);
      if (!result.Items || result.Items.length === 0) {
        return false;
      }
      
      // Delete each item
      for (const item of result.Items) {
        const deleteCommand = new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            petId: item.petId,
            timestamp: item.timestamp
          }
        });
        await docClient.send(deleteCommand);
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
}
