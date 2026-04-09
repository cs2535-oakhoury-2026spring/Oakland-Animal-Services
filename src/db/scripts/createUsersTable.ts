import { CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { dynamoClient } from "../../config/index.js";
import { fileURLToPath } from "url";

export const main = async () => {
    try {
        await dynamoClient.send(new DescribeTableCommand({ TableName: "Users" }));
        console.log("Table 'Users' already exists. Skipping creation.");
        return;
    } catch (err: any) {
        if (err.name !== "ResourceNotFoundException") throw err;
    }

    await dynamoClient.send(new CreateTableCommand({
        TableName: "Users",
        AttributeDefinitions: [
            { AttributeName: "username", AttributeType: "S" },
            { AttributeName: "userId", AttributeType: "S" },
        ],
        KeySchema: [
            { AttributeName: "username", KeyType: "HASH" },
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

    console.log("Table 'Users' created.");
};

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
