import { CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { dynamoClient } from "../../config/index.js";
import { fileURLToPath } from "url";

export const main = async () => {
    try {
        await dynamoClient.send(new DescribeTableCommand({ TableName: "RefreshTokens" }));
        console.log("Table 'RefreshTokens' already exists. Skipping creation.");
        return;
    } catch (err: any) {
        if (err.name !== "ResourceNotFoundException") throw err;
    }

    await dynamoClient.send(new CreateTableCommand({
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
                KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
                Projection: { ProjectionType: "ALL" },
            },
        ],
        BillingMode: "PAY_PER_REQUEST",
    }));

    console.log("Table 'RefreshTokens' created.");
};

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
