import {
  type BehaviorNote,
} from "../../models/BehaviorNote.schema.js";
import { BehaviorNoteRepository } from "../../types/index.js";
import { ScanCommand, QueryCommand, PutCommand, DeleteCommand} from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../config/index.js";

const TABLE_NAME = "BehaviorNotes";

export class BehaviorNoteDBRepository implements BehaviorNoteRepository {
  /**
   * Retrieves all behavior notes with optional pagination.
   * @param limit - Maximum number of notes to return.
   * @param page - Page number for pagination (1-indexed).
   * @returns A promise resolving to an array of BehaviorNote objects.
   */
  async getBehaviorNotes(limit?: number, page?: number): Promise<BehaviorNote[]> {
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
      
      return (pageResult.Items ?? []) as BehaviorNote[];
    } catch (error) {
      return [];
    }
  }

  /**
   * Retrieves all behavior notes associated with a specific pet.
   * @param petId - The integer ID of the pet.
   * @returns A promise resolving to an array of BehaviorNote objects for that pet.
   */
  async getBehaviorNoteByPetId(petId: number): Promise<BehaviorNote[]> {
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "petId = :petId",
        ExpressionAttributeValues: {
          ":petId": petId
        }
      }));
      
      return (result.Items ?? []) as BehaviorNote[];
    } catch (error) {
      console.error("Error fetching behavior notes by petId:", error);
      return [];
    }
  }

  /**
   * Inserts a new behavior note into the database.
   * @param note - The BehaviorNote object to add, including content, author, petId, and timestamp.
   * @returns A promise resolving to true if the insert succeeded, false otherwise.
   */
  async addBehaviorNote(note: BehaviorNote): Promise<boolean> {
    try {
      // Generate a unique ID using timestamp and random number
      const uniqueId = note.timestamp.getTime() + Math.floor(Math.random() * 1000);
      
      // Create the item to insert with generated ID
      const item = {
        ...note,
        id: uniqueId,
        timestamp: note.timestamp.toISOString(), // Convert Date to ISO string for DynamoDB
      };

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      });

      await docClient.send(command);
      return true;
    } catch (error) {
      console.error("Error adding behavior note:", error);
      return false;
    }
  }

  /**
   * Deletes a single behavior note by its ID.
   * @param uniqueId - The unique ID of the behavior note to remove.
   * @returns A promise resolving to true if the deletion succeeded, false otherwise.
   */
  async removeBehaviorNoteById(uniqueId: number): Promise<boolean> {
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
   * Deletes all behavior notes associated with a specific pet.
   * @param petId - The integer ID of the pet whose notes should be removed.
   * @returns A promise resolving to true if the deletions succeeded, false otherwise.
   */
  async removeNotesByPetId(petId: number): Promise<boolean> {
    throw new Error("BehaviorNoteDBRepository: removeNotesByPetId not implemented");
  }
}
