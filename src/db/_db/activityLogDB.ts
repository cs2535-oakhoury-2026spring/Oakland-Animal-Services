import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../config/index.js";
import type { ActivityLog, ActivityTag } from "../../models/ActivityLog.schema.js";

const TABLE_NAME = "ActivityLog";
const PARTITION_KEY = "ALL";

export async function addActivityLog(log: ActivityLog): Promise<void> {
    await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            pk: PARTITION_KEY,
            sk: `${log.timestamp}#${log.logId}`,
            ...log,
        },
    }));
}

export interface GetActivityLogsParams {
    tags?: ActivityTag[];
    actor?: string;
    action?: string;
    from?: string;  // ISO date string (inclusive)
    to?: string;    // ISO date string (inclusive)
    limit?: number;
    page?: number;
}

export async function getActivityLogs(params: GetActivityLogsParams): Promise<ActivityLog[]> {
    const { tags, actor, action, from, to, limit = 20, page = 1 } = params;

    const filterParts: string[] = [];
    const exprValues: Record<string, any> = { ":pk": PARTITION_KEY };
    const exprNames: Record<string, string> = {};

    if (tags && tags.length > 0) {
        const tagPlaceholders = tags.map((_, i) => `:tag${i}`).join(", ");
        filterParts.push(`#tag IN (${tagPlaceholders})`);
        exprNames["#tag"] = "tag";
        tags.forEach((t, i) => { exprValues[`:tag${i}`] = t; });
    }

    if (actor) {
        filterParts.push("actor = :actor");
        exprValues[":actor"] = actor;
    }

    if (action) {
        filterParts.push("#action = :action");
        exprNames["#action"] = "action";
        exprValues[":action"] = action;
    }

    if (from) {
        filterParts.push("#ts >= :from");
        exprNames["#ts"] = "timestamp";
        exprValues[":from"] = from;
    }
    if (to) {
        if (!exprNames["#ts"]) exprNames["#ts"] = "timestamp";
        filterParts.push("#ts <= :to");
        exprValues[":to"] = to;
    }

    const filterExpression = filterParts.length > 0 ? filterParts.join(" AND ") : undefined;
    const hasExprNames = Object.keys(exprNames).length > 0;

  
    let allItems: ActivityLog[] = [];
    let lastKey: any = undefined;

    do {
        const result: any = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "pk = :pk",
            ExpressionAttributeValues: exprValues,
            ...(hasExprNames && { ExpressionAttributeNames: exprNames }),
            ...(filterExpression && { FilterExpression: filterExpression }),
            ScanIndexForward: false,
            ExclusiveStartKey: lastKey,
        }));
        allItems.push(...((result.Items ?? []) as ActivityLog[]));
        lastKey = result.LastEvaluatedKey;
    } while (lastKey);

    const start = (page - 1) * limit;
    return allItems.slice(start, start + limit);
}
