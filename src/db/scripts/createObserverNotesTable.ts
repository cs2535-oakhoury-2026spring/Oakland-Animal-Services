import {
  CreateTableCommand,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";
import { dynamoClient } from "../../config/index.js";
import { fileURLToPath } from "url";

export const main = async () => {
  try {
    await dynamoClient.send(
      new DescribeTableCommand({ TableName: "ObserverNotes" }),
    );
    console.log("Table 'ObserverNotes' already exists. Skipping creation.");
    return;
  } catch (err: any) {
    if (err.name !== "ResourceNotFoundException") throw err;
  }

  await dynamoClient.send(
    new CreateTableCommand({
      TableName: "ObserverNotes",
      AttributeDefinitions: [
        { AttributeName: "petId", AttributeType: "N" },
        { AttributeName: "timestamp", AttributeType: "S" },
        { AttributeName: "id", AttributeType: "N" },
      ],
      KeySchema: [
        { AttributeName: "petId", KeyType: "HASH" },
        { AttributeName: "timestamp", KeyType: "RANGE" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "id-index",
          KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
          Projection: { ProjectionType: "ALL" },
        },
      ],
      BillingMode: "PAY_PER_REQUEST",
    }),
  );

  console.log("Table 'ObserverNotes' created.");
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
