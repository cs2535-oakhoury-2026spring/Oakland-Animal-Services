import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";
dotenv.config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  ...(process.env.AWS_ENDPOINT && {
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
    },
  }),
});

export const main = async () => {
  try {
    await client.send(
      new DescribeTableCommand({ TableName: "PetCompatibility" }),
    );
    console.log("Table 'PetCompatibility' already exists. Skipping creation.");
    return;
  } catch (err: any) {
    if (err.name !== "ResourceNotFoundException") {
      throw err;
    }
  }

  await client.send(
    new CreateTableCommand({
      TableName: "PetCompatibility",
      AttributeDefinitions: [{ AttributeName: "petId", AttributeType: "N" }],
      KeySchema: [{ AttributeName: "petId", KeyType: "HASH" }],
      BillingMode: "PAY_PER_REQUEST",
    }),
  );

  console.log("PetCompatibility table created.");
};

main();
