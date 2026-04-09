import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type JwtPayload } from "../services/auth.js";

// Extend Express Request to include the authenticated user
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or invalid authorization header" });
        return;
    }

    const token = authHeader.slice(7);
    let user: JwtPayload;
    try {
        user = verifyAccessToken(token);
        req.user = user;
    } catch {
        res.status(401).json({ error: "Invalid or expired access token" });
        return;
    }

    // Block all routes except change-password if user must change their password
    if (user.mustChangePassword && req.path !== "/api/auth/change-password") {
        res.status(403).json({ error: "PASSWORD_CHANGE_REQUIRED" });
        return;
    }

    next();
}

export function requireStaff(req: Request, res: Response, next: NextFunction): void {
    const role = req.user?.role;
    if (role === "staff" || role === "admin") {
        next();
        return;
    }
    res.status(403).json({ error: "Staff or admin access required" });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
    if (req.user?.role === "admin") {
        next();
        return;
    }
    res.status(403).json({ error: "Admin access required" });
}
