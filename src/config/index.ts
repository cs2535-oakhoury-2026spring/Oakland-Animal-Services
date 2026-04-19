import dotenv from "dotenv";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
dotenv.config();

export default {
  port: Number(process.env.PORT) || 3000,
  LLM_API_KEY: process.env.OPENAI_API_KEY ?? "",
  PET_LOCATION_CACHE_TTL:
    Number(process.env.PET_LOCATION_CACHE_TTL) || 60 * 60 * 1000, // In milliseconds, default to 1 hour

  rescueGroups: {
    endpoint: process.env.RESCUE_GROUPS_ENDPOINT ?? "",
    bearer: process.env.RESCUE_GROUPS_BEARER ?? "",
  },

  aws: {
    region: process.env.AWS_REGION ?? "us-east-1",
    endpoint: process.env.AWS_ENDPOINT ?? "http://localhost:4566",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
  },
};

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  ...(process.env.AWS_ENDPOINT && {
    endpoint: process.env.AWS_ENDPOINT ?? "http://localhost:4566",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
    },
  }),
});

export const dynamoClient = client;
export const docClient = DynamoDBDocumentClient.from(client);
