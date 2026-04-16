import { CreateTableCommand, DescribeTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import config from "../../config/index.js";

const client = new DynamoDBClient({
    region: config.aws.region,
    ...(process.env.AWS_ENDPOINT && {
        endpoint: config.aws.endpoint,
        credentials: {
            accessKeyId: config.aws.accessKeyId,
            secretAccessKey: config.aws.secretAccessKey,
        },
    }),
});

// Merged table for both behavior and observer notes.
// Each item carries a `noteType` attribute: "BEHAVIOR" | "OBSERVER"
export const main = async () => {
    try {
        await client.send(new DescribeTableCommand({ TableName: "Notes" }));
        console.log("Table 'Notes' already exists. Skipping creation.");
        return;
    } catch (err: any) {
        if (err.name !== "ResourceNotFoundException") {
            throw err;
        }
    }

    const command = new CreateTableCommand({
        TableName: "Notes",
        AttributeDefinitions: [
            {
                AttributeName: "petId",
                AttributeType: "N",
            },
            {
                AttributeName: "timestamp",
                AttributeType: "S",
            },
            {
                AttributeName: "id",
                AttributeType: "N",
            },
            {
                AttributeName: "noteType",
                AttributeType: "S",
            },
        ],
        KeySchema: [
            {
                AttributeName: "petId",
                KeyType: "HASH",
            },
            {
                AttributeName: "timestamp",
                KeyType: "RANGE",
            },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: "id-index",
                KeySchema: [
                    {
                        AttributeName: "id",
                        KeyType: "HASH",
                    },
                ],
                Projection: {
                    ProjectionType: "ALL",
                },
            },
            {
                IndexName: "noteType-index",
                KeySchema: [
                    {
                        AttributeName: "noteType",
                        KeyType: "HASH",
                    },
                    {
                        AttributeName: "timestamp",
                        KeyType: "RANGE",
                    },
                ],
                Projection: {
                    ProjectionType: "ALL",
                },
            },
        ],
        BillingMode: "PAY_PER_REQUEST",
    });

    const response = await client.send(command);
    console.log(response);
};

main();
