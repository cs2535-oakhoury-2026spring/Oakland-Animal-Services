import {
  CreateTableCommand,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";
import { dynamoClient } from "../../config/index.js";
import { fileURLToPath } from "url";

export const main = async () => {
  try {
    await dynamoClient.send(
      new DescribeTableCommand({ TableName: "ActivityLog" }),
    );
    console.log("Table 'ActivityLog' already exists. Skipping creation.");
    return;
  } catch (err: any) {
    if (err.name !== "ResourceNotFoundException") throw err;
  }

  await dynamoClient.send(
    new CreateTableCommand({
      TableName: "ActivityLog",
      AttributeDefinitions: [
        { AttributeName: "pk", AttributeType: "S" },
        { AttributeName: "sk", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "pk", KeyType: "HASH" },
        { AttributeName: "sk", KeyType: "RANGE" },
      ],
      BillingMode: "PAY_PER_REQUEST",
    }),
  );

  console.log("Table 'ActivityLog' created.");
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
