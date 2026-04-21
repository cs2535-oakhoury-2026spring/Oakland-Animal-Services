import { z } from "zod";

export const UserRole = z.enum(["admin", "staff", "volunteer", "device"]);

export const UserSchema = z.object({
  userId: z.string().uuid(),
  username: z.string().min(1),
  passwordHash: z.string(),
  role: UserRole,
  tag: z.string().min(1).optional(),
  deviceName: z.string().optional(), // device accounts only
  expiresAt: z.string().optional(), // volunteer accounts only, ISO date string
  mustChangePassword: z.boolean(),
  createdAt: z.string(),
});

// Shape returned to callers — never includes passwordHash
export const SafeUserSchema = UserSchema.omit({ passwordHash: true });

export type UserRole = z.infer<typeof UserRole>;
export type User = z.infer<typeof UserSchema>;
export type SafeUser = z.infer<typeof SafeUserSchema>;
