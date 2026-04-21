import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
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
  { userId: string; expiresAtMs: number }
>();

function rememberRotatedRefreshToken(tokenId: string, userId: string): void {
  recentlyRotatedRefreshTokens.set(tokenId, {
    userId,
    expiresAtMs: Date.now() + ROTATED_REFRESH_GRACE_MS,
  });
}

function consumeRecentlyRotatedRefreshToken(tokenId: string): string | null {
  const record = recentlyRotatedRefreshTokens.get(tokenId);
  if (!record) return null;
  if (record.expiresAtMs < Date.now()) {
    recentlyRotatedRefreshTokens.delete(tokenId);
    return null;
  }
  return record.userId;
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
};

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

export function isEnvManagedAdminSessionValid(payload: JwtPayload): boolean {
  if (payload.role !== "admin" || payload.userId !== "admin") {
    return true;
  }

  const envAdmin = getEnvAdminByUserId(payload.userId);
  if (!envAdmin) return false;

  // .env admin sessions must match the currently configured admin username.
  return payload.username === envAdmin.username;
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

    const payload: JwtPayload = {
      userId: envAdmin.userId,
      username: envAdmin.username,
      role: "admin",
      mustChangePassword: false,
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = await createRefreshToken(envAdmin.userId);

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
  if (!record) {
    const graceUserId = consumeRecentlyRotatedRefreshToken(oldRefreshToken);
    if (!graceUserId) return null;
    refreshUserId = graceUserId;
  } else {
    // Check refresh token expiry
    if (new Date(record.expiresAt) < new Date()) {
      await deleteRefreshToken(oldRefreshToken);
      return null;
    }

    // Rotate: delete old token, issue new one
    await deleteRefreshToken(oldRefreshToken);
    rememberRotatedRefreshToken(oldRefreshToken, record.userId);
    refreshUserId = record.userId;
  }

  const newRefreshToken = await createRefreshToken(refreshUserId);

  // .env admins are not in DB — rebuild payload directly
  const envAdmin = getEnvAdminByUserId(refreshUserId);
  if (envAdmin) {
    const payload: JwtPayload = {
      userId: envAdmin.userId,
      username: envAdmin.username,
      role: "admin",
      mustChangePassword: false,
    };
    return {
      accessToken: signAccessToken(payload),
      refreshToken: newRefreshToken,
    };
  }

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
