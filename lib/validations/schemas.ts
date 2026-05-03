// Zod validation schemas – used in both API routes and client forms
// to ensure consistent, type-safe input validation.
import { z } from "zod";

// ── Common ─────────────────────────────────────────────────────

const nonEmptyString = (maxLen = 255) =>
  z.string().min(1, "This field is required").max(maxLen).trim();

// ── Auth schemas ──────────────────────────────────────────────

export const registerSchema = z.object({
  name: nonEmptyString(64).regex(
    /^[\w\s'-]+$/,
    "Name contains invalid characters",
  ),
  email: z
    .string()
    .email("Enter a valid email address")
    .max(255)
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});

export const loginSchema = z.object({
  /** Can be an email address OR a username */
  identifier: z.string().min(1, "Enter your username or email").max(255).trim(),
  password: z.string().min(1).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ── Team schemas ──────────────────────────────────────────────

export const createTeamSchema = z.object({
  name: nonEmptyString(64).regex(
    /^[\w\s'-]+$/,
    "Team name contains invalid characters",
  ),
  webhookUrl: z
    .string()
    .url("Enter a valid URL")
    .startsWith(
      "https://discord.com/api/webhooks/",
      "Must be a Discord webhook URL",
    )
    .max(512),
});

export const joinTeamSchema = z.object({
  inviteCode: z
    .string()
    .min(4, "Invalid invite code")
    .max(32)
    .regex(/^[A-Za-z0-9]+$/, "Invite code must be alphanumeric"),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type JoinTeamInput = z.infer<typeof joinTeamSchema>;

// ── Task schemas ──────────────────────────────────────────────

export const createTaskSchema = z.object({
  teamId: nonEmptyString(128),
  title: nonEmptyString(128),
  description: z.string().max(2048).trim().default(""),
  assignedTo: z.string().max(128).optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: nonEmptyString(128).optional(),
  description: z.string().max(2048).trim().optional(),
  status: z.enum(["pending", "in_progress", "done"]).optional(),
  assignedTo: z.string().max(128).nullable().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
