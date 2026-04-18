import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  getUserByUsername,
  getUserById,
  updateUser,
} from "../db/_db/usersDB.js";
import {
  createRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  deleteAllRefreshTokensForUser,
} from "../db/_db/refreshTokensDB.js";
import type { SafeUser, UserRole } from "../models/User.schema.js";

const JWT_SECRET = process.env.JWT_SECRET!; // guaranteed by server.ts startup check
const ACCESS_TOKEN_EXPIRY = "15m";

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

export async function login(
  username: string,
  password: string,
): Promise<LoginResult> {
  const normalizedUsername = username.toLowerCase();

  // Check admin credentials from .env first
  if (normalizedUsername === process.env.ADMIN_USER?.toLowerCase()) {
    if (password !== process.env.ADMIN_PASS) {
      return { ok: false, error: "INVALID_CREDENTIALS" };
    }

    const payload: JwtPayload = {
      userId: "admin",
      username: normalizedUsername,
      role: "admin",
      mustChangePassword: false,
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = await createRefreshToken("admin");

    return {
      ok: true,
      accessToken,
      refreshToken,
      user: {
        userId: "admin",
        username: normalizedUsername,
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
  if (!record) return null;

  // Check refresh token expiry
  if (new Date(record.expiresAt) < new Date()) {
    await deleteRefreshToken(oldRefreshToken);
    return null;
  }

  // Rotate: delete old token, issue new one
  await deleteRefreshToken(oldRefreshToken);
  const newRefreshToken = await createRefreshToken(record.userId);

  // Admin is not in DB — rebuild payload directly
  if (record.userId === "admin") {
    const payload: JwtPayload = {
      userId: "admin",
      username: process.env.ADMIN_USER ?? "admin",
      role: "admin",
      mustChangePassword: false,
    };
    return {
      accessToken: signAccessToken(payload),
      refreshToken: newRefreshToken,
    };
  }

  const user = await getUserById(record.userId);
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
