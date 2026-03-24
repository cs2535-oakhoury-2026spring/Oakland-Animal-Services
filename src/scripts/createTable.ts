import { DynamoDBClient , CreateTableCommand , ListTablesCommand} from "@aws-sdk/client-dynamodb";


//Creating the DynamoDB client
const client = new DynamoDBClient({
    region: process.env.DYNAMODB_REGION || "us-west-1",
    endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:8000",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local"
    } ,
    requestHandler: {
    requestTimeout: 5000,
  }
});

const TABLE_NAME = "ObservationNotes"; // Create ObservationNotes table

async function createTable() {
    try  {
        const {TableNames} = await client.send(new ListTablesCommand({}));
        if (TableNames?.includes(TABLE_NAME)) {
            console.log("Table already exists");
            return;
        }
        await client.send(new CreateTableCommand({
        TableName: TABLE_NAME,
        AttributeDefinitions: [
          { AttributeName: "PK", AttributeType: "S" }, // Partition key -> animalId
          { AttributeName: "SK", AttributeType: "S" }, // Sort key -> noteId
          { AttributeName: "dateKey", AttributeType: "S" }, // Sort key for the GSI by date
        ],
        KeySchema: [
          { AttributeName: "PK", KeyType: "HASH" },
          { AttributeName: "SK", KeyType: "RANGE" },
        ],
        // GSI for querying by date
        GlobalSecondaryIndexes: [
          {
            IndexName: "ByDate",
            KeySchema: [
              { AttributeName: "dateKey", KeyType: "HASH" },
              { AttributeName: "SK", KeyType: "RANGE" },
            ],
            Projection: {
              ProjectionType: "ALL",
            },
          },
        ],
        BillingMode: "PAY_PER_REQUEST",
      })
    );

    console.log(`Table "${TABLE_NAME}" created successfully.`);
    } catch (err) {
        console.error("Failed to create table", err);
        process.exit(1);
    }
}

createTable();