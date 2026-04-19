import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../config/index.js";
import { type PetCompatibility } from "../../models/PetCompatibility.schema.js";

const TABLE_NAME = "PetCompatibility";

export async function getCompatibility(petId: number): Promise<PetCompatibility | null> {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { petId },
    }));
    return result.Item ? (result.Item as PetCompatibility) : null;
  } catch (err) {
    console.error("getCompatibility failed", err);
    return null;
  }
}

export async function upsertCompatibility(data: PetCompatibility): Promise<boolean> {
  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: data,
    }));
    return true;
  } catch (err) {
    console.error("upsertCompatibility failed", err);
    return false;
  }
}
