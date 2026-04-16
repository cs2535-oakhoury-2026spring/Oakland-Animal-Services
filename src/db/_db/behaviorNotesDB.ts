import {
  type BehaviorNote,
} from "../../models/BehaviorNote.schema.js";
import { BehaviorNoteRepository } from "../../types/index.js";
import { ScanCommand, QueryCommand, PutCommand, DeleteCommand} from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../config/index.js";

const TABLE_NAME = "Notes";
const NOTE_TYPE = "BEHAVIOR";

/**
 * Repository for behavior notes stored in the merged Notes table.
 *
 * All reads and writes are constrained to items whose noteType is BEHAVIOR.
 * The API layer does not provide noteType; it is assigned here to keep
 * behavior note storage isolated from observer notes in the shared table.
 */
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
      
      return (pageResult.Items ?? []) as BehaviorNote[];
    } catch (error) {
      return [];
    }
  }

  /**
    * Retrieves all behavior notes associated with a specific pet from Notes.
    *
    * Results are filtered to the BEHAVIOR noteType so observer notes are not
    * returned even though both note kinds share the same table.
   * @param petId - The integer ID of the pet.
   * @returns A promise resolving to an array of BehaviorNote objects for that pet.
   */
  async getBehaviorNoteByPetId(petId: number): Promise<BehaviorNote[]> {
    try {
      const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "petId = :petId",
        FilterExpression: "noteType = :noteType",
        ExpressionAttributeValues: {
          ":petId": petId,
          ":noteType": NOTE_TYPE,
        }
      }));
      
      return (result.Items ?? []) as BehaviorNote[];
    } catch (error) {
      console.error("Error fetching behavior notes by petId:", error);
      return [];
    }
  }

  /**
    * Inserts a new behavior note into the merged Notes table.
    *
    * The repository assigns noteType = BEHAVIOR before persistence so callers
    * do not need to know about the storage layout.
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
        noteType: NOTE_TYPE,
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
    * Deletes a single behavior note by its ID from the merged Notes table.
    *
    * The lookup uses the id-index and filters on noteType so an observer note
    * with the same id cannot be removed accidentally.
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
    * Deletes all behavior notes associated with a specific pet from Notes.
    *
    * Only items tagged BEHAVIOR are deleted.
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
