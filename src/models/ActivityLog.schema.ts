import { z } from "zod";

export const ActivityTag = z.enum(["behaviorNote", "observerNote", "authEvent"]);
export type ActivityTag = z.infer<typeof ActivityTag>;

export const ActivityLogSchema = z.object({
    logId: z.uuid(),
    date: z.string(),       // YYYY-MM-DD
    timestamp: z.string(),  // ISO string
    tag: ActivityTag,
    actor: z.string(),
    action: z.string(),
    jsonData: z.record(z.string(), z.unknown()).optional(),
});

export type ActivityLog = z.infer<typeof ActivityLogSchema>;
