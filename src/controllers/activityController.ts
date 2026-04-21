import { Request, Response } from "express";
import { getActivityLogs } from "../db/repositories/activityLogDB.js";
import { ActivityTag } from "../models/ActivityLog.schema.js";

const VALID_TAGS: ActivityTag[] = ["behaviorNote", "observerNote", "authEvent"];
const STAFF_ALLOWED_TAGS: ActivityTag[] = ["behaviorNote", "observerNote"];

export async function listActivityLogs(req: Request, res: Response) {
  const user = req.user!;
  const isAdmin = user.role === "admin";

  const tagsParam = req.query.tags;
  let tags: ActivityTag[] | undefined;

  if (typeof tagsParam === "string") {
    const parsed = tagsParam.split(",").map((t) => t.trim()) as ActivityTag[];
    const invalid = parsed.filter((t) => !VALID_TAGS.includes(t));
    if (invalid.length > 0) {
      return res.status(400).json({
        error: `Invalid tags: ${invalid.join(", ")}. Valid: ${VALID_TAGS.join(", ")}`,
      });
    }
    if (!isAdmin && parsed.includes("authEvent")) {
      return res
        .status(403)
        .json({ error: "Staff cannot access auth event logs" });
    }
    tags = parsed;
  }

  if (!tags && !isAdmin) {
    tags = STAFF_ALLOWED_TAGS;
  }

  const limitParam = req.query.limit;
  const pageParam = req.query.page;
  const maxExportLimit = isAdmin ? 1000000 : 10000;
  let limit = typeof limitParam === "string" ? parseInt(limitParam, 10) : 20;
  const page = typeof pageParam === "string" ? parseInt(pageParam, 10) : 1;

  if (isNaN(limit) || limit <= 0) {
    return res.status(400).json({ error: "limit must be a positive integer" });
  }

  if (limit > maxExportLimit) {
    limit = maxExportLimit;
  }

  if (isNaN(page) || page <= 0) {
    return res.status(400).json({ error: "page must be a positive integer" });
  }

  const actor =
    typeof req.query.actor === "string" ? req.query.actor : undefined;
  const actionParam =
    typeof req.query.action === "string" ? req.query.action : undefined;
  const actions = actionParam
    ? actionParam
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
    : undefined;
  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;

  const result = await getActivityLogs({
    tags,
    actor,
    actions,
    from,
    to,
    limit,
    page,
  });
  res.json({ success: true, ...result });
}
