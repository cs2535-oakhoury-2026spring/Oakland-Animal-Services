import { CreateTableCommand, DescribeTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import config from "../../config/index.js";

const client = new DynamoDBClient({
    region: config.aws.region,
    endpoint: config.aws.endpoint,
    credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
    },
});

export const main = async () => {
    try {
        await client.send(new DescribeTableCommand({ TableName: "BehaviorNotes" }));
        console.log("Table 'BehaviorNotes' already exists. Skipping creation.");
        return;
    } catch (err: any) {
        if (err.name !== "ResourceNotFoundException") {
            throw err;
        }
    }
    const command = new CreateTableCommand({
        TableName: "BehaviorNotes",
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
                AttributeName : "id",
                AttributeType : "N"
            }
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
        ],
        BillingMode: "PAY_PER_REQUEST",
    });

    const response = await client.send(command);
    console.log(response);
};

main();
