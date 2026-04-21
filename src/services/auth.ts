import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { createHash } from "crypto";
import {
  getUserByUsername,
  getUserById,
  updateUser,
} from "../db/repositories/usersDB.js";
import {
  createRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  deleteAllRefreshTokensForUser,
} from "../db/repositories/refreshTokensDB.js";
import type { SafeUser, UserRole } from "../models/User.schema.js";

const JWT_SECRET = process.env.JWT_SECRET!; // guaranteed by server.ts startup check
const ACCESS_TOKEN_EXPIRY = "15m";
const ROTATED_REFRESH_GRACE_MS = 15_000;
const recentlyRotatedRefreshTokens = new Map<
  string,
  { userId: string; expiresAtMs: number; adminConfigVersion?: string }
>();

function rememberRotatedRefreshToken(
  tokenId: string,
  userId: string,
  adminConfigVersion?: string,
): void {
  recentlyRotatedRefreshTokens.set(tokenId, {
    userId,
    expiresAtMs: Date.now() + ROTATED_REFRESH_GRACE_MS,
    adminConfigVersion,
  });
}

function consumeRecentlyRotatedRefreshToken(
  tokenId: string,
): { userId: string; adminConfigVersion?: string } | null {
  const record = recentlyRotatedRefreshTokens.get(tokenId);
  if (!record) return null;
  if (record.expiresAtMs < Date.now()) {
    recentlyRotatedRefreshTokens.delete(tokenId);
    return null;
  }
  return {
    userId: record.userId,
    adminConfigVersion: record.adminConfigVersion,
  };
}

type EnvAdminAccount = {
  userId: string;
  username: string;
  password: string;
};

function parseEnvAdminAccounts(): EnvAdminAccount[] {
  const primaryUsername = process.env.ADMIN_USER?.trim().toLowerCase();
  const primaryPassword = process.env.ADMIN_PASS ?? "";
  if (primaryUsername) {
    return [
      {
        userId: "admin",
        username: primaryUsername,
        password: primaryPassword,
      },
    ];
  }
  return [];
}

function getEnvAdminByUsername(username: string): EnvAdminAccount | null {
  const normalized = username.toLowerCase();
  return parseEnvAdminAccounts().find((a) => a.username === normalized) ?? null;
}

function getEnvAdminByUserId(userId: string): EnvAdminAccount | null {
  return parseEnvAdminAccounts().find((a) => a.userId === userId) ?? null;
}

export type JwtPayload = {
  userId: string;
  username: string;
  role: UserRole;
  deviceName?: string;
  mustChangePassword: boolean;
  expiresAt?: string;
  adminConfigVersion?: string;
};

function getEnvAdminConfigVersion(envAdmin: EnvAdminAccount): string {
  return createHash("sha256")
    .update(`${envAdmin.username}:${envAdmin.password}`)
    .digest("hex");
}

export function isEnvManagedAdminSessionValid(payload: {
  userId: string;
  role: UserRole;
  username: string;
  adminConfigVersion?: string;
}): boolean {
  if (payload.role !== "admin" || payload.userId !== "admin") return true;
  const envAdmin = getEnvAdminByUserId(payload.userId);
  if (!envAdmin) return false;

  const currentVersion = getEnvAdminConfigVersion(envAdmin);
  return (
    payload.username === envAdmin.username &&
    payload.adminConfigVersion === currentVersion
  );
}

export type LoginResult =
  | {
      ok: true;
      accessToken: string;
      refreshToken: string;
      user: SafeUser;
    }
  | {
      ok: false;
      error: "INVALID_CREDENTIALS" | "ACCOUNT_EXPIRED";
    };

function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export async function login(
  username: string,
  password: string,
): Promise<LoginResult> {
  const normalizedUsername = username.toLowerCase();

  // Check admin credentials from .env first
  const envAdmin = getEnvAdminByUsername(normalizedUsername);
  if (envAdmin) {
    if (password !== envAdmin.password) {
      return { ok: false, error: "INVALID_CREDENTIALS" };
    }

    const adminConfigVersion = getEnvAdminConfigVersion(envAdmin);

    const payload: JwtPayload = {
      userId: envAdmin.userId,
      username: envAdmin.username,
      role: "admin",
      mustChangePassword: false,
      adminConfigVersion,
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = await createRefreshToken(envAdmin.userId, {
      adminConfigVersion,
    });

    return {
      ok: true,
      accessToken,
      refreshToken,
      user: {
        userId: envAdmin.userId,
        username: envAdmin.username,
        role: "admin",
        mustChangePassword: false,
        createdAt: "",
      },
    };
  }

  // Look up regular user in DB
  const user = await getUserByUsername(normalizedUsername);
  if (!user) return { ok: false, error: "INVALID_CREDENTIALS" };

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) return { ok: false, error: "INVALID_CREDENTIALS" };

  // Check volunteer expiry
  if (user.role === "volunteer" && user.expiresAt) {
    if (new Date(user.expiresAt) < new Date()) {
      return { ok: false, error: "ACCOUNT_EXPIRED" };
    }
  }

  const payload: JwtPayload = {
    userId: user.userId,
    username: user.username,
    role: user.role,
    deviceName: user.deviceName,
    mustChangePassword: user.mustChangePassword,
    expiresAt: user.expiresAt,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = await createRefreshToken(user.userId);
  const { passwordHash: _, ...safeUser } = user;

  return { ok: true, accessToken, refreshToken, user: safeUser };
}

// Returns new access token AND rotated refresh token
export async function refresh(oldRefreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  const record = await getRefreshToken(oldRefreshToken);

  let refreshUserId: string;
  let adminConfigVersionFromToken: string | undefined;
  if (!record) {
    const graceRecord = consumeRecentlyRotatedRefreshToken(oldRefreshToken);
    if (!graceRecord) return null;
    refreshUserId = graceRecord.userId;
    adminConfigVersionFromToken = graceRecord.adminConfigVersion;
  } else {
    // Check refresh token expiry
    if (new Date(record.expiresAt) < new Date()) {
      await deleteRefreshToken(oldRefreshToken);
      return null;
    }

    adminConfigVersionFromToken =
      typeof record.adminConfigVersion === "string"
        ? record.adminConfigVersion
        : undefined;

    // Rotate: delete old token, issue new one
    await deleteRefreshToken(oldRefreshToken);
    rememberRotatedRefreshToken(
      oldRefreshToken,
      record.userId,
      adminConfigVersionFromToken,
    );
    refreshUserId = record.userId;
  }

  // .env admins are not in DB — rebuild payload directly
  const envAdmin = getEnvAdminByUserId(refreshUserId);
  if (envAdmin) {
    const currentAdminConfigVersion = getEnvAdminConfigVersion(envAdmin);
    if (adminConfigVersionFromToken !== currentAdminConfigVersion) {
      return null;
    }

    const newRefreshToken = await createRefreshToken(refreshUserId, {
      adminConfigVersion: currentAdminConfigVersion,
    });
    const payload: JwtPayload = {
      userId: envAdmin.userId,
      username: envAdmin.username,
      role: "admin",
      mustChangePassword: false,
      adminConfigVersion: currentAdminConfigVersion,
    };
    return {
      accessToken: signAccessToken(payload),
      refreshToken: newRefreshToken,
    };
  }

  const newRefreshToken = await createRefreshToken(refreshUserId);

  const user = await getUserById(refreshUserId);
  if (!user) return null;

  // Re-check volunteer expiry on every refresh
  if (user.role === "volunteer" && user.expiresAt) {
    if (new Date(user.expiresAt) < new Date()) {
      await deleteRefreshToken(newRefreshToken);
      return null;
    }
  }

  const payload: JwtPayload = {
    userId: user.userId,
    username: user.username,
    role: user.role,
    deviceName: user.deviceName,
    mustChangePassword: user.mustChangePassword,
    expiresAt: user.expiresAt,
  };

  return {
    accessToken: signAccessToken(payload),
    refreshToken: newRefreshToken,
  };
}

export async function logout(refreshToken: string): Promise<void> {
  await deleteRefreshToken(refreshToken);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user) return false;

  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) return false;

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await updateUser(userId, { passwordHash, mustChangePassword: false });
  await deleteAllRefreshTokensForUser(userId);
  return true;
}
