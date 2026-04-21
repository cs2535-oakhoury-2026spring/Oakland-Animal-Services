import {
  PutCommand,
  QueryCommand,
  DeleteCommand,
  ScanCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";
import { docClient } from "../../config/index.js";
import type { User, SafeUser, UserRole } from "../../models/User.schema.js";

const TABLE_NAME = "Users";

function normalizeTag(tag?: string): string {
  const trimmed = tag?.trim();
  return trimmed ? trimmed : "No-tag";
}

function toSafeUser(user: User): SafeUser {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

// Username is the PK — direct lookup, no GSI needed
export async function getUserByUsername(
  username: string,
): Promise<User | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { username: username.toLowerCase() },
    }),
  );
  return (result.Item as User) ?? null;
}

// userId lookup goes through the GSI
export async function getUserById(userId: string): Promise<User | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "userId-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId },
    }),
  );
  return (result.Items?.[0] as User) ?? null;
}

// Atomically creates a user — throws if username is already taken
export async function createUser(params: {
  username: string;
  passwordHash: string;
  role: UserRole;
  tag?: string;
  deviceName?: string;
  expiresAt?: string;
}): Promise<SafeUser> {
  const user: User = {
    userId: randomUUID(),
    username: params.username.toLowerCase(),
    passwordHash: params.passwordHash,
    role: params.role,
    tag: normalizeTag(params.tag),
    deviceName: params.deviceName,
    expiresAt: params.expiresAt,
    mustChangePassword: params.role !== "device",
    createdAt: new Date().toISOString(),
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: user,
        ConditionExpression: "attribute_not_exists(username)", // atomic uniqueness check
      }),
    );
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new Error("USERNAME_TAKEN");
    }
    throw err;
  }

  return toSafeUser(user);
}

export async function updateUser(
  userId: string,
  updates: Partial<
    Pick<User, "passwordHash" | "mustChangePassword" | "expiresAt" | "tag">
  >,
): Promise<void> {
  const existing = await getUserById(userId);
  if (!existing) throw new Error("User not found");

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: { ...existing, ...updates },
    }),
  );
}

export async function deleteUser(userId: string): Promise<void> {
  const existing = await getUserById(userId);
  if (!existing) return;

  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { username: existing.username },
    }),
  );
}

export async function listUsers(): Promise<SafeUser[]> {
  const result = await docClient.send(
    new ScanCommand({ TableName: TABLE_NAME }),
  );
  return (result.Items ?? []).map((item) => toSafeUser(item as User));
}
