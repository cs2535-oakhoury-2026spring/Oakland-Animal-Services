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
        await client.send(new DescribeTableCommand({ TableName: "RefreshTokens" }));
        console.log("Table 'RefreshTokens' already exists. Skipping creation.");
        return;
    } catch (err: any) {
        if (err.name !== "ResourceNotFoundException") {
            throw err;
        }
    }

    const command = new CreateTableCommand({
        TableName: "RefreshTokens",
        AttributeDefinitions: [
            { AttributeName: "tokenId", AttributeType: "S" },
            { AttributeName: "userId", AttributeType: "S" },
        ],
        KeySchema: [
            { AttributeName: "tokenId", KeyType: "HASH" },
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
    console.log("Created 'RefreshTokens' table:", response);
};

main();
