import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import {
  createUser,
  getUserByUsername,
  getUserById,
  updateUser,
  deleteUser,
  listUsers,
} from "../db/repositories/usersDB.js";
import { deleteAllRefreshTokensForUser } from "../db/repositories/refreshTokensDB.js";
import { logActivity } from "../utils/logActivity.js";

const SALT_ROUNDS = 12;

// Common schema helper for optional ISO timestamp validation used by volunteers only.
const validIsoDate = z
  .string()
  .refine((val) => !isNaN(new Date(val).getTime()), {
    message: "Must be a valid ISO date string",
  });

// Input schema for single user creation.
const CreateUserSchema = z.object({
  username: z.string().min(1).toLowerCase(),
  password: z.string().min(1),
  role: z.enum(["admin", "staff", "volunteer", "device"]),
  tag: z.string().min(1).optional(),
  deviceName: z.string().optional(),
  expiresAt: validIsoDate.optional(),
});

// Input schema for updating a user's expiration or tag.
const UpdateUserSchema = z.object({
  expiresAt: validIsoDate.optional(),
  tag: z.string().min(1).optional(),
});

// Input schema for resetting a user's password.
const ResetPasswordSchema = z.object({
  password: z.string().min(1),
});

// Normalize a tag value and fall back to a stable default when empty.
function normalizeTag(tag?: string): string {
  const trimmed = tag?.trim();
  return trimmed ? trimmed : "No-tag";
}

export async function createUserHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = CreateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const { username, password, role, tag, deviceName, expiresAt } = parsed.data;
  const callerRole = req.user!.role;

  // Staff accounts are scoped to volunteer management only.
  if (callerRole === "staff") {
    if (role !== "volunteer") {
      res
        .status(403)
        .json({ error: "Staff can only create volunteer accounts" });
      return;
    }
  }

  // Device accounts require a deviceName field.
  if (role === "device" && !deviceName) {
    res
      .status(400)
      .json({ error: "deviceName is required for device accounts" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    const user = await createUser({
      username,
      passwordHash,
      role,
      tag: normalizeTag(tag),
      deviceName,
      expiresAt,
    });
    logActivity({
      tag: "authEvent",
      actor: req.user!.username,
      action: "USER_CREATED",
      jsonData: { username, role },
    });
    res.status(201).json({ success: true, user });
  } catch (err: any) {
    if (err.message === "USERNAME_TAKEN") {
      res.status(409).json({ error: "Username already taken" });
      return;
    }
    throw err;
  }
}

export async function listUsersHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const users = await listUsers();

  // Staff only see volunteer accounts; admin sees all account types.
  if (req.user!.role === "staff") {
    const volunteerOnly = users.filter((u) => u.role === "volunteer");
    res.json({ success: true, users: volunteerOnly });
    return;
  }
  res.json({ success: true, users });
}

export async function resetPasswordHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.params.userId as string;
  const parsed = ResetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Password is required" });
    return;
  }

  const target = await getUserById(userId);
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Staff accounts cannot manage non-volunteer password resets.
  if (req.user!.role === "staff" && target.role !== "volunteer") {
    res.status(403).json({ error: "Staff can only reset volunteer passwords" });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, SALT_ROUNDS);
  await updateUser(userId, {
    passwordHash,
    mustChangePassword: target.role !== "device",
  });
  await deleteAllRefreshTokensForUser(userId);

  logActivity({
    tag: "authEvent",
    actor: req.user!.username,
    action: "USER_PASSWORD_RESET",
    jsonData: { targetUserId: userId, targetUsername: target.username },
  });
  res.json({ success: true });
}

export async function updateUserHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.params.userId as string;
  const parsed = UpdateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const target = await getUserById(userId);
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Staff accounts can only update volunteer accounts.
  if (req.user!.role === "staff" && target.role !== "volunteer") {
    res.status(403).json({ error: "Staff can only update volunteer accounts" });
    return;
  }

  await updateUser(userId, parsed.data);
  const updated = await getUserById(userId);
  const { passwordHash: _, ...safeUser } = updated!;

  logActivity({
    tag: "authEvent",
    actor: req.user!.username,
    action: "USER_UPDATED",
    jsonData: { targetUserId: userId, ...parsed.data },
  });
  res.json({ success: true, user: safeUser });
}

export async function deleteUserHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.params.userId as string;

  const target = await getUserById(userId);
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Staff accounts are restricted to removing volunteer accounts only.
  if (req.user!.role === "staff" && target.role !== "volunteer") {
    res.status(403).json({ error: "Staff can only delete volunteer accounts" });
    return;
  }

  await deleteAllRefreshTokensForUser(userId);
  await deleteUser(userId);

  logActivity({
    tag: "authEvent",
    actor: req.user!.username,
    action: "USER_DELETED",
    jsonData: {
      targetUserId: userId,
      targetUsername: target.username,
      role: target.role,
    },
  });
  res.json({ success: true });
}

const BatchRowSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  role: z.enum(["staff", "volunteer", "device"]),
  expiresat: z.string().optional(),
  tag: z.string().optional(),
});

function parseOptionalExpiryToIso(raw?: string): string | undefined {
  if (!raw || !raw.trim()) return undefined;
  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

// Minimal CSV parser to convert a batch import payload into rows keyed by header.
function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const values = line.split(",").map((v) => v.trim());
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
    });
}

// Schema for batch deletion requests.
const BatchDeleteSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1),
});

// Schema for batch update requests.
const BatchUpdateSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1),
  updates: z
    .object({
      expiresAt: validIsoDate.optional(),
      tag: z.string().min(1).optional(),
    })
    .refine(
      (value) => value.expiresAt !== undefined || value.tag !== undefined,
      {
        message: "At least one update field is required",
      },
    ),
});

export async function batchUpdateUsersHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = BatchUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const { userIds, updates } = parsed.data;
  const normalizedUpdates = {
    ...updates,
    ...(updates.tag ? { tag: normalizeTag(updates.tag) } : {}),
  };

  const updated: string[] = [];
  const failed: Array<{ userId: string; reason: string }> = [];

  // Iterate through each requested user update and preserve per-user success/failure.
  for (const userId of userIds) {
    try {
      const target = await getUserById(userId);
      if (!target) {
        failed.push({ userId, reason: "User not found" });
        continue;
      }

      if (req.user!.role === "staff" && target.role !== "volunteer") {
        failed.push({
          userId,
          reason: "Staff can only update volunteer accounts",
        });
        continue;
      }

      await updateUser(userId, normalizedUpdates);
      logActivity({
        tag: "authEvent",
        actor: req.user!.username,
        action: "USER_UPDATED",
        jsonData: {
          targetUserId: userId,
          targetUsername: target.username,
          role: target.role,
          batch: true,
          updates: normalizedUpdates,
        },
      });
      updated.push(target.username);
    } catch (err: any) {
      failed.push({ userId, reason: err?.message || "Unable to update user" });
    }
  }

  res.status(200).json({ success: true, updated, failed });
}

export async function batchDeleteUsersHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = BatchDeleteSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const { userIds } = parsed.data;
  const deleted: string[] = [];
  const failed: Array<{ userId: string; reason: string }> = [];

  // Process deletes one at a time and record failures without aborting the entire batch.
  for (const userId of userIds) {
    try {
      const target = await getUserById(userId);
      if (!target) {
        failed.push({ userId, reason: "User not found" });
        continue;
      }

      if (req.user!.role === "staff" && target.role !== "volunteer") {
        failed.push({
          userId,
          reason: "Staff can only delete volunteer accounts",
        });
        continue;
      }

      await deleteAllRefreshTokensForUser(userId);
      await deleteUser(userId);

      logActivity({
        tag: "authEvent",
        actor: req.user!.username,
        action: "USER_DELETED",
        jsonData: {
          targetUserId: userId,
          targetUsername: target.username,
          role: target.role,
          batch: true,
        },
      });

      deleted.push(target.username);
    } catch (err: any) {
      failed.push({ userId, reason: err?.message || "Unable to delete user" });
    }
  }

  res.status(200).json({ success: true, deleted, failed });
}

export async function batchCreateUsersHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const { csv } = req.body as { csv?: string };
  if (typeof csv !== "string" || !csv.trim()) {
    res.status(400).json({ error: "csv field is required" });
    return;
  }

  const rows = parseCSV(csv);
  if (rows.length === 0) {
    res
      .status(400)
      .json({ error: "CSV must have a header row and at least one data row" });
    return;
  }

  const created: string[] = [];
  const updated: string[] = [];
  const failed: Array<{ username: string; reason: string }> = [];
  const callerRole = req.user!.role;

  for (const row of rows) {
    const parsed = BatchRowSchema.safeParse(row);
    if (!parsed.success) {
      failed.push({
        username: row.username || "(empty)",
        reason:
          "Invalid row: " +
          parsed.error.issues.map((i) => i.message).join(", "),
      });
      continue;
    }
    const { username, password, role, expiresat, tag } = parsed.data;
    const expiresAtIso = parseOptionalExpiryToIso(expiresat);
    const tagValue = normalizeTag(tag);

    // Enforce staff batch imports to volunteer-only accounts.
    if (callerRole === "staff" && role !== "volunteer") {
      failed.push({
        username,
        reason: "Staff can only create volunteer accounts",
      });
      continue;
    }

    if (expiresat && !expiresAtIso) {
      failed.push({ username, reason: "Invalid expiresAt date format" });
      continue;
    }

    // Only volunteer accounts may carry an expiration date.
    if (expiresAtIso && role !== "volunteer") {
      failed.push({
        username,
        reason: "expiresAt is only allowed for volunteer accounts",
      });
      continue;
    }

    try {
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      await createUser({
        username,
        passwordHash,
        role,
        tag: tagValue,
        expiresAt: expiresAtIso,
      });
      logActivity({
        tag: "authEvent",
        actor: req.user!.username,
        action: "USER_CREATED",
        jsonData: { username, role, batch: true },
      });
      created.push(username);
    } catch (err: any) {
      if (err.message === "USERNAME_TAKEN") {
        const existing = await getUserByUsername(username);
        const isExpiredVolunteer =
          existing?.role === "volunteer" &&
          !!existing.expiresAt &&
          new Date(existing.expiresAt) < new Date();

        // Reuse expired volunteer accounts when provided with a new expiration.
        if (
          role === "volunteer" &&
          expiresAtIso &&
          existing &&
          isExpiredVolunteer
        ) {
          await updateUser(existing.userId, {
            expiresAt: expiresAtIso,
            tag: tagValue,
          });
          logActivity({
            tag: "authEvent",
            actor: req.user!.username,
            action: "USER_UPDATED",
            jsonData: {
              targetUserId: existing.userId,
              targetUsername: existing.username,
              role: existing.role,
              batch: true,
              updatedField: "expiresAt,tag",
            },
          });
          updated.push(username);
          continue;
        }
      }

      failed.push({
        username,
        reason:
          err.message === "USERNAME_TAKEN"
            ? "Username already taken"
            : "Internal error",
      });
    }
  }

  res.status(200).json({ success: true, created, updated, failed });
}
