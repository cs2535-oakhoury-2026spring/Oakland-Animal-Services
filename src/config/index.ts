import dotenv from "dotenv";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient} from "@aws-sdk/lib-dynamodb";
dotenv.config();

export const config =  {
  port: Number(process.env.PORT) || 3000,
  USE_MOCK_RG_DB: process.env.USE_MOCK_RG_DB === "true",
  aws: {
    region: process.env.AWS_REGION ?? "us-west-1",
    endpoint: process.env.AWS_ENDPOINT ?? "http://dynamodb-local:8000",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "local",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "local",
  },
  rescueGroups: {
    endpoint: process.env.RESCUE_GROUPS_ENDPOINT ?? "",
    bearer: process.env.RESCUE_GROUPS_BEARER ?? "",
  },
};

const dbClient = new DynamoDBClient({
  region: config.aws.region,
  endpoint: config.aws.endpoint,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
  requestHandler: {
    requestTimeout: 5000,
  },
});

export const dbDocumentClient = DynamoDBDocumentClient.from(dbClient);
