import { type ObserverNote } from "../../models/ObserverNote.schema.js";
import { ObserverNoteRepository } from "../../types/index.js";
import { BaseNoteDBRepository } from "./notesDB.js";
import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../config/index.js";

export class ObserverNoteDBRepository
  extends BaseNoteDBRepository<ObserverNote>
  implements ObserverNoteRepository
{
  constructor() {
    super("OBSERVER");
  }

  async updateObserverNoteStatus(
    uniqueId: number,
    status: string,
  ): Promise<boolean> {
    try {
      const queryCommand = new QueryCommand({
        TableName: "Notes",
        IndexName: "id-index",
        KeyConditionExpression: "id = :id",
        FilterExpression: "noteType = :noteType",
        ExpressionAttributeValues: {
          ":id": uniqueId,
          ":noteType": "OBSERVER",
        },
      });

      const result: any = await docClient.send(queryCommand);
      const item = result.Items?.[0];
      if (!item) {
        throw new Error("Observer note not found");
      }

      await docClient.send(
        new UpdateCommand({
          TableName: "Notes",
          Key: {
            petId: item.petId,
            timestamp: item.timestamp,
          },
          UpdateExpression: "SET #status = :status",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": status,
          },
        }),
      );

      return true;
    } catch (error) {
      console.error("Error updating observer note status:", error);
      return false;
    }
  }

  async updateObserverNoteStaffComment(
    uniqueId: number,
    comment: string,
    actor: string,
  ): Promise<boolean> {
    try {
      const queryCommand = new QueryCommand({
        TableName: "Notes",
        IndexName: "id-index",
        KeyConditionExpression: "id = :id",
        FilterExpression: "noteType = :noteType",
        ExpressionAttributeValues: {
          ":id": uniqueId,
          ":noteType": "OBSERVER",
        },
      });

      const result: any = await docClient.send(queryCommand);
      const item = result.Items?.[0];
      if (!item) {
        return false;
      }

      const existing = item.staffComment;
      const nowIso = new Date().toISOString();
      const nextStaffComment =
        existing && typeof existing === "object" && typeof existing.from === "string"
          ? {
              ...existing,
              text: comment,
              editedBy: actor,
              editedAt: nowIso,
            }
          : {
              text: comment,
              from: actor,
              at: nowIso,
            };

      await docClient.send(
        new UpdateCommand({
          TableName: "Notes",
          Key: {
            petId: item.petId,
            timestamp: item.timestamp,
          },
          UpdateExpression: "SET #staffComment = :staffComment",
          ExpressionAttributeNames: {
            "#staffComment": "staffComment",
          },
          ExpressionAttributeValues: {
            ":staffComment": nextStaffComment,
          },
        }),
      );

      return true;
    } catch (error) {
      console.error("Error updating observer note staff comment:", error);
      return false;
    }
  }
}
