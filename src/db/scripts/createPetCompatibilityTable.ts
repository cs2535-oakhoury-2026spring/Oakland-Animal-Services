import {
  CreateTableCommand,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";
import { dynamoClient } from "../../config/index.js";
import { fileURLToPath } from "url";

export const main = async () => {
  try {
    await dynamoClient.send(
      new DescribeTableCommand({ TableName: "PetCompatibility" }),
    );
    console.log("Table 'PetCompatibility' already exists. Skipping creation.");
    return;
  } catch (err: any) {
    if (err.name !== "ResourceNotFoundException") throw err;
  }

  await dynamoClient.send(
    new CreateTableCommand({
      TableName: "PetCompatibility",
      AttributeDefinitions: [{ AttributeName: "petId", AttributeType: "N" }],
      KeySchema: [{ AttributeName: "petId", KeyType: "HASH" }],
      BillingMode: "PAY_PER_REQUEST",
    }),
  );

  console.log("Table 'PetCompatibility' created.");
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
