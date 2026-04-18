import type { Request } from "express";

/**
 * Resolves the author string for a note based on the authenticated user's role.
 *
 * - device accounts: requires `author` from body (min 2 chars), returns "Author (DeviceName)"
 * - all other roles: ignores `author` from body, returns req.user.username
 *
 * Returns null if the user is a device account and author is missing or too short.
 */
export function resolveAuthor(req: Request, author?: string): string | null {
    const user = req.user!;

    if (user.role === "device") {
        if (!author || author.trim().length < 2) return null;
        const rawDeviceLabel = user.deviceName?.trim() || user.username;
        const normalizedDeviceLabel = rawDeviceLabel.replace(/^device-/i, "");
        return `${author.trim()} (${normalizedDeviceLabel})`;
    }

    return user.username;
}
