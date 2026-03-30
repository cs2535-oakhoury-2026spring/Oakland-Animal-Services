import {
  type ObserverNote,
} from "../../models/ObserverNote.schema.js";
import { ObserverNoteRepository } from "../../types/index.js";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../config/index.js";
const TABLE_NAME = "ObserverNotes";


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
          ExclusiveStartKey: lastKey,
        }));
        lastKey = result.LastEvaluatedKey;
        if (!lastKey) return [];
      }
      
      const pageResult = await docClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        Limit: resolvedLimit,
        ExclusiveStartKey: lastKey,
      }));
      
      return (pageResult.Items ?? []) as ObserverNote[];
    } catch (error) {
      return [];
    }
  }

  /**
   * Retrieves all observer notes associated with a specific pet.
   * @param petId - The integer ID of the pet.
   * @returns A promise resolving to an array of ObserverNote objects for that pet.
   */
  async getObserverNoteByPetId(petId: number): Promise<ObserverNote[]> {
    try {
      const command = new QueryCommand(
        {
          TableName: TABLE_NAME,
          KeyConditionExpression: "petId = :petId",
          ExpressionAttributeValues: {
            ":petId": petId
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

  /**
   * Inserts a new observer note into the database.
   * @param note - The ObserverNote object to add, including content, author, petId, timestamp, and optional status.
   * @returns A promise resolving to true if the insert succeeded, false otherwise.
   */
  async addObserverNote(note: ObserverNote): Promise<boolean> {
    try {
      // Generate a unique ID using timestamp and random number
      const uniqueId = note.timestamp.getTime() + Math.floor(Math.random() * 1000);
      
      // Create the item to insert with generated ID
      const item = {
        ...note,
        id: uniqueId,
        timestamp: note.timestamp.toISOString(), // Convert Date to ISO string for DynamoDB
        status: note.status ?? "RAISED", // Default status if not provided
      };

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      });

      await docClient.send(command);
      return true;
    } catch (error) {
      console.error("Error adding observer note:", error);
      return false;
    }
  }

  /**
   * Deletes a single observer note by its ID.
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
            ExpressionAttributeValues: {
              ":id": uniqueId
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
   * Updates the status field of a specific observer note.
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
        ExpressionAttributeValues: {
          ":id": uniqueId
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
        UpdateExpression: "SET status = :status",
        ExpressionAttributeValues: {
          ":status": (status === "RESOLVED") ? status : "RAISED"
        }
      });
      
      await docClient.send(updateCommand);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Deletes all observer notes associated with a specific pet.
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
        ExpressionAttributeValues : {":petId" : petId}
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
