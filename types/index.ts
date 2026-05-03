// ─────────────────────────────────────────────────────────────
//  Central TypeScript type definitions for the entire project
// ─────────────────────────────────────────────────────────────

import { Timestamp } from "firebase/firestore";

// ── Auth ─────────────────────────────────────────────────────

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  createdAt: Timestamp | Date;
}

// ── Teams ─────────────────────────────────────────────────────

export type TeamRole = "owner" | "admin" | "member";

export interface Team {
  teamId: string;
  name: string;
  ownerId: string;
  /** webhookUrl is NEVER sent to the frontend – server-side only */
  webhookUrl?: string;
  inviteCode: string;
  createdAt: Timestamp | Date;
}

/** Public representation – webhookUrl stripped out */
export type TeamPublic = Omit<Team, "webhookUrl">;

export interface TeamMember {
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: Timestamp | Date;
}

// ── Tasks ─────────────────────────────────────────────────────

export type TaskStatus = "pending" | "in_progress" | "done";

export interface Task {
  taskId: string;
  teamId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedTo: string | null; // uid
  createdBy: string; // uid
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// ── API Payloads ──────────────────────────────────────────────

export interface CreateTaskPayload {
  teamId: string;
  title: string;
  description: string;
  assignedTo?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assignedTo?: string | null;
}

export interface CreateTeamPayload {
  name: string;
  webhookUrl: string;
}

export interface JoinTeamPayload {
  inviteCode: string;
}

// ── API Responses ─────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ── Node-RED Event ────────────────────────────────────────────

export type NodeRedEventType =
  | "task_created"
  | "task_completed"
  | "task_updated";

export interface NodeRedPayload {
  event: NodeRedEventType;
  taskId: string;
  taskTitle: string;
  teamId: string;
  teamName: string;
  actorName: string;
  assignedTo?: string;
  webhookUrl: string; // resolved server-side, never from client
  timestamp: string;
}

// ── UI helpers ────────────────────────────────────────────────

export interface SelectOption {
  label: string;
  value: string;
}
