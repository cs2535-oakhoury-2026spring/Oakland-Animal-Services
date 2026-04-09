import { Request, Response } from "express";
import { z } from "zod";
import { login, refresh, logout, changePassword } from "../services/auth.js";
import { logActivity } from "../utils/logActivity.js";

const REFRESH_TOKEN_COOKIE = "refreshToken";
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

const LoginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(1),
});

export async function loginHandler(req: Request, res: Response): Promise<void> {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Username and password are required" });
        return;
    }

    const result = await login(parsed.data.username, parsed.data.password);
    if (!result) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }

    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken: result.accessToken, user: result.user });
}

export async function refreshHandler(req: Request, res: Response): Promise<void> {
    const oldRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!oldRefreshToken) {
        res.status(401).json({ error: "No refresh token" });
        return;
    }

    const result = await refresh(oldRefreshToken);
    if (!result) {
        res.clearCookie(REFRESH_TOKEN_COOKIE);
        res.status(401).json({ error: "Invalid or expired refresh token" });
        return;
    }

    // Rotate the refresh token cookie
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken: result.accessToken });
}

export async function logoutHandler(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (refreshToken) {
        await logout(refreshToken);
    }
    res.clearCookie(REFRESH_TOKEN_COOKIE);
    res.json({ success: true });
}

export function meHandler(req: Request, res: Response): void {
    res.json({ user: req.user });
}

export async function changePasswordHandler(req: Request, res: Response): Promise<void> {
    if (req.user!.role === "admin") {
        res.status(400).json({ error: "Admin password is managed via environment variables" });
        return;
    }

    const parsed = ChangePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "currentPassword and newPassword are required" });
        return;
    }

    const ok = await changePassword(req.user!.userId, parsed.data.currentPassword, parsed.data.newPassword);
    if (!ok) {
        res.status(401).json({ error: "Current password is incorrect" });
        return;
    }

    logActivity({ tag: "authEvent", actor: req.user!.username, action: "PASSWORD_CHANGED" });

    // Password changed — clear the refresh token cookie (all sessions already invalidated in changePassword)
    res.clearCookie(REFRESH_TOKEN_COOKIE);
    res.json({ success: true });
}
