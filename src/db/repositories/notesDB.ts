import {
  ScanCommand,
  QueryCommand,
  PutCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../config/index.js";

const TABLE_NAME = "Notes";

export abstract class BaseNoteDBRepository<
  T extends { id: number; timestamp: Date; petId: number },
> {
  constructor(private readonly noteType: string) {}

  private normalizeItem(rawItem: any): T {
    const { noteType, timestamp, ...rest } = rawItem;
    return {
      ...rest,
      timestamp: timestamp ? new Date(timestamp) : timestamp,
    } as T;
  }

  private normalizeItems(rawItems: any[] = []): T[] {
    return rawItems.map((item) => this.normalizeItem(item));
  }

  async getNotes(limit?: number, page?: number): Promise<T[]> {
    const resolvedLimit = limit ?? 10;
    const resolvedPage = page ?? 1;

    let lastKey = undefined;
    for (let i = 1; i < resolvedPage; i++) {
      const result: any = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          Limit: resolvedLimit,
          FilterExpression: "noteType = :noteType",
          ExpressionAttributeValues: {
            ":noteType": this.noteType,
          },
          ExclusiveStartKey: lastKey,
        }),
      );
      lastKey = result.LastEvaluatedKey;
      if (!lastKey) {
        return [];
      }
    }

    const pageResult: any = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        Limit: resolvedLimit,
        FilterExpression: "noteType = :noteType",
        ExpressionAttributeValues: {
          ":noteType": this.noteType,
        },
        ExclusiveStartKey: lastKey,
      }),
    );

    return this.normalizeItems(pageResult.Items);
  }

  async getNoteByPetId(petId: number): Promise<T[]> {
    const result: any = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "petId = :petId",
        FilterExpression: "noteType = :noteType",
        ExpressionAttributeValues: {
          ":petId": petId,
          ":noteType": this.noteType,
        },
      }),
    );

    return this.normalizeItems(result.Items);
  }

  async getNoteById(id: number): Promise<T | null> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "id-index",
        KeyConditionExpression: "id = :id",
        FilterExpression: "noteType = :noteType",
        ExpressionAttributeValues: {
          ":id": id,
          ":noteType": this.noteType,
        },
      });
      const result: any = await docClient.send(command);
      return result.Items?.[0] ? this.normalizeItem(result.Items[0]) : null;
    } catch {
      return null;
    }
  }

  async addNote(note: T): Promise<number> {
    const uniqueId =
      note.id > 0
        ? note.id
        : note.timestamp.getTime() + Math.floor(Math.random() * 1000);

    const item = {
      ...note,
      id: uniqueId,
      noteType: this.noteType,
      timestamp: note.timestamp.toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      }),
    );

    return uniqueId;
  }

  async removeNoteById(uniqueId: number): Promise<boolean> {
    try {
      const result: any = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "id-index",
          KeyConditionExpression: "id = :id",
          FilterExpression: "noteType = :noteType",
          ExpressionAttributeValues: {
            ":id": uniqueId,
            ":noteType": this.noteType,
          },
        }),
      );

      const item = result.Items?.[0];
      if (!item) {
        return false;
      }

      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            petId: item.petId,
            timestamp: item.timestamp,
          },
        }),
      );

      return true;
    } catch {
      return false;
    }
  }

  async removeNotesByPetId(petId: number): Promise<boolean> {
    try {
      const result: any = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "petId = :petId",
          FilterExpression: "noteType = :noteType",
          ExpressionAttributeValues: {
            ":petId": petId,
            ":noteType": this.noteType,
          },
        }),
      );

      if (!result.Items || result.Items.length === 0) {
        return false;
      }

      for (const item of result.Items) {
        await docClient.send(
          new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
              petId: item.petId,
              timestamp: item.timestamp,
            },
          }),
        );
      }

      return true;
    } catch {
      return false;
    }
  }
}
