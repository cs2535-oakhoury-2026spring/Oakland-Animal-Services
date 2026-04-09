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

export const main = async () => {
    try {
        await client.send(new DescribeTableCommand({ TableName: "Users" }));
        console.log("Table 'Users' already exists. Skipping creation.");
        return;
    } catch (err: any) {
        if (err.name !== "ResourceNotFoundException") {
            throw err;
        }
    }

    const command = new CreateTableCommand({
        TableName: "Users",
        AttributeDefinitions: [
            { AttributeName: "username", AttributeType: "S" }, // PK — enforces uniqueness atomically
            { AttributeName: "userId", AttributeType: "S" },
        ],
        KeySchema: [
            { AttributeName: "username", KeyType: "HASH" },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: "userId-index",
                KeySchema: [
                    { AttributeName: "userId", KeyType: "HASH" },
                ],
                Projection: { ProjectionType: "ALL" },
            },
        ],
        BillingMode: "PAY_PER_REQUEST",
    });

    const response = await client.send(command);
    console.log("Created 'Users' table:", response);
};

main();
