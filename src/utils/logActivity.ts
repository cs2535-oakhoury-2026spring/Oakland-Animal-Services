import { randomUUID } from "crypto";
import { addActivityLog } from "../db/_db/activityLogDB.js";
import type { ActivityLog, ActivityTag } from "../models/ActivityLog.schema.js";

export interface LogActivityParams {
    tag: ActivityTag;
    actor: string;
    action: string;
    jsonData?: Record<string, unknown>;
}

/**
 * Fire-and-forget activity logger. Never throws — logging failures
 * are printed to stderr but do not affect the calling request.
 */
export function logActivity(params: LogActivityParams): void {
    const now = new Date();
    const log: ActivityLog = {
        logId: randomUUID(),
        date: now.toISOString().split("T")[0],
        timestamp: now.toISOString(),
        tag: params.tag,
        actor: params.actor,
        action: params.action,
        jsonData: params.jsonData,
    };
    addActivityLog(log).catch(err => console.error("[ActivityLog] Failed to write log:", err));
}
