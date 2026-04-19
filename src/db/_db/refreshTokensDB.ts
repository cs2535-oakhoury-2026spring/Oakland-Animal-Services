import { PutCommand, QueryCommand, DeleteCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { docClient } from "../../config/index.js";

const TABLE_NAME = "RefreshTokens";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const DYNAMO_BATCH_SIZE = 25; // DynamoDB max per BatchWrite

export async function createRefreshToken(userId: string): Promise<string> {
    const tokenId = randomUUID();
    const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS).toISOString();

    await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: { tokenId, userId, expiresAt, createdAt: new Date().toISOString() },
    }));

    return tokenId;
}

export async function getRefreshToken(tokenId: string): Promise<{ tokenId: string; userId: string; expiresAt: string } | null> {
    const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "tokenId = :tokenId",
        ExpressionAttributeValues: { ":tokenId": tokenId },
    }));
    return (result.Items?.[0] as any) ?? null;
}

export async function deleteRefreshToken(tokenId: string): Promise<void> {
    await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { tokenId },
    }));
}

// Called on password reset or account deletion to boot all active sessions.
// Uses batch deletes (25 per request) instead of N individual deletes.
export async function deleteAllRefreshTokensForUser(userId: string): Promise<void> {
    const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": userId },
    }));

    const items = result.Items ?? [];
    if (items.length === 0) return;

    // Chunk into batches of 25
    for (let i = 0; i < items.length; i += DYNAMO_BATCH_SIZE) {
        const chunk = items.slice(i, i + DYNAMO_BATCH_SIZE);
        await docClient.send(new BatchWriteCommand({
            RequestItems: {
                [TABLE_NAME]: chunk.map(item => ({
                    DeleteRequest: { Key: { tokenId: item.tokenId } },
                })),
            },
        }));
    }
}
