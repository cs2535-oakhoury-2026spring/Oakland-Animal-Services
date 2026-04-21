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

const validIsoDate = z
  .string()
  .refine((val) => !isNaN(new Date(val).getTime()), {
    message: "Must be a valid ISO date string",
  });

const CreateUserSchema = z.object({
  username: z.string().min(1).toLowerCase(),
  password: z.string().min(1),
  role: z.enum(["admin", "staff", "volunteer", "device"]),
  tag: z.string().min(1).optional(),
  deviceName: z.string().optional(),
  expiresAt: validIsoDate.optional(),
});

const UpdateUserSchema = z.object({
  expiresAt: validIsoDate.optional(),
  tag: z.string().min(1).optional(),
});

const ResetPasswordSchema = z.object({
  password: z.string().min(1),
});

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

  // Staff can only create volunteers with an expiry date
  if (callerRole === "staff") {
    if (role !== "volunteer") {
      res
        .status(403)
        .json({ error: "Staff can only create volunteer accounts" });
      return;
    }
    if (!expiresAt) {
      res
        .status(400)
        .json({ error: "expiresAt is required when creating a volunteer" });
      return;
    }
  }

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

  // Staff can only reset volunteers
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

  // Staff can only update volunteers
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

  // Staff can only delete volunteers
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

    if (callerRole === "staff" && role !== "volunteer") {
      failed.push({
        username,
        reason: "Staff can only create volunteer accounts",
      });
      continue;
    }

    if (callerRole === "staff" && !expiresAtIso) {
      failed.push({
        username,
        reason: "expiresAt is required for volunteer accounts created by staff",
      });
      continue;
    }

    if (expiresat && !expiresAtIso) {
      failed.push({ username, reason: "Invalid expiresAt date format" });
      continue;
    }

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
