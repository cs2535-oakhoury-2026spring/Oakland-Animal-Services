import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { createUser, getUserById, updateUser, deleteUser, listUsers } from "../db/_db/usersDB.js";
import { deleteAllRefreshTokensForUser } from "../db/_db/refreshTokensDB.js";
import { logActivity } from "../utils/logActivity.js";

const SALT_ROUNDS = 12;

const validIsoDate = z.string().refine(val => !isNaN(new Date(val).getTime()), {
    message: "Must be a valid ISO date string",
});

const CreateUserSchema = z.object({
    username: z.string().min(1).toLowerCase(),
    password: z.string().min(1),
    role: z.enum(["staff", "volunteer", "device"]),
    deviceName: z.string().optional(),
    expiresAt: validIsoDate.optional(),
});

const UpdateUserSchema = z.object({
    expiresAt: validIsoDate.optional(),
});

const ResetPasswordSchema = z.object({
    password: z.string().min(1),
});

export async function createUserHandler(req: Request, res: Response): Promise<void> {
    const parsed = CreateUserSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
        return;
    }

    const { username, password, role, deviceName, expiresAt } = parsed.data;
    const callerRole = req.user!.role;

    // Staff can only create volunteers with an expiry date
    if (callerRole === "staff") {
        if (role !== "volunteer") {
            res.status(403).json({ error: "Staff can only create volunteer accounts" });
            return;
        }
        if (!expiresAt) {
            res.status(400).json({ error: "expiresAt is required when creating a volunteer" });
            return;
        }
    }

    if (role === "device" && !deviceName) {
        res.status(400).json({ error: "deviceName is required for device accounts" });
        return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    try {
        const user = await createUser({ username, passwordHash, role, deviceName, expiresAt });
        logActivity({ tag: "authEvent", actor: req.user!.username, action: "USER_CREATED", jsonData: { username, role } });
        res.status(201).json({ success: true, user });
    } catch (err: any) {
        if (err.message === "USERNAME_TAKEN") {
            res.status(409).json({ error: "Username already taken" });
            return;
        }
        throw err;
    }
}

export async function listUsersHandler(_req: Request, res: Response): Promise<void> {
    const users = await listUsers();
    res.json({ success: true, users });
}

export async function resetPasswordHandler(req: Request, res: Response): Promise<void> {
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
    await updateUser(userId, { passwordHash, mustChangePassword: true });
    await deleteAllRefreshTokensForUser(userId);

    logActivity({ tag: "authEvent", actor: req.user!.username, action: "USER_PASSWORD_RESET", jsonData: { targetUserId: userId, targetUsername: target.username } });
    res.json({ success: true });
}

export async function updateUserHandler(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    const parsed = UpdateUserSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
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

    logActivity({ tag: "authEvent", actor: req.user!.username, action: "USER_UPDATED", jsonData: { targetUserId: userId, ...parsed.data } });
    res.json({ success: true, user: safeUser });
}

export async function deleteUserHandler(req: Request, res: Response): Promise<void> {
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

    logActivity({ tag: "authEvent", actor: req.user!.username, action: "USER_DELETED", jsonData: { targetUserId: userId, targetUsername: target.username, role: target.role } });
    res.json({ success: true });
}
