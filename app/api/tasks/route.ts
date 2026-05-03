// POST /api/tasks  – create a task and fire a Node-RED notification
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";

import { requireAuth, AuthError } from "@/lib/firebase/authServer";
import { getAdminDb } from "@/lib/firebase/admin";
import { createTaskSchema } from "@/lib/validations/schemas";
import { sanitizeObject } from "@/lib/utils/sanitize";
import { rateLimit, getClientIp } from "@/lib/utils/rateLimit";
import { ok, err } from "@/lib/utils/apiResponse";

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting ────────────────────────────────────────
    const ip = getClientIp(req);
    if (!rateLimit(`tasks:create:${ip}`, 30, 60_000)) {
      return err("Too many requests", 429);
    }

    // ── Auth ─────────────────────────────────────────────────
    let actor;
    try {
      actor = await requireAuth(req);
    } catch (e) {
      return e instanceof AuthError
        ? err(e.message, e.statusCode)
        : err("Unauthorized", 401);
    }

    // ── Validation ───────────────────────────────────────────
    let body;
    try {
      body = await req.json();
    } catch {
      return err("Invalid JSON body", 400);
    }

    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return err(parsed.error.errors[0].message, 422);
    }

    const input = sanitizeObject(parsed.data);
    const { teamId, title, description, assignedTo } = input;

    const db = getAdminDb();

    // ── Check team membership ────────────────────────────────
    const memberSnap = await db
      .collection("teamMembers")
      .where("teamId", "==", teamId)
      .where("userId", "==", actor.uid)
      .limit(1)
      .get();

    if (memberSnap.empty) {
      return err("You are not a member of this team", 403);
    }

    // ── Get team (for name + webhook) ────────────────────────
    const teamDoc = await db.collection("teams").doc(teamId).get();
    if (!teamDoc.exists) return err("Team not found", 404);
    const team = teamDoc.data()!;

    // ── Create the task ──────────────────────────────────────
    const taskId = uuidv4();
    const now = FieldValue.serverTimestamp();

    await db
      .collection("tasks")
      .doc(taskId)
      .set({
        taskId,
        teamId,
        title,
        description: description ?? "",
        status: "pending",
        assignedTo: assignedTo ?? null,
        createdBy: actor.uid,
        createdAt: now,
        updatedAt: now,
      });

    // ── Trigger Node-RED notification (non-blocking) ─────────
    if (team.webhookUrl) {
      triggerNodeRed({
        event: "task_created",
        taskId,
        taskTitle: title,
        teamId,
        teamName: team.name,
        actorName: actor.name ?? actor.email ?? "Someone",
        assignedTo: assignedTo ?? undefined,
        webhookUrl: team.webhookUrl,
        timestamp: new Date().toISOString(),
      }).catch((e) => console.error("[Node-RED notify error]", e));
    }

    return ok({ taskId }, 201);
  } catch (e) {
    console.error("[POST /api/tasks]", e);
    return err("Internal server error", 500);
  }
}

// ── Internal helper ────────────────────────────────────────────
async function triggerNodeRed(payload: object): Promise<void> {
  const nodeRedUrl = process.env.NODE_RED_URL;
  const nodeRedSecret = process.env.NODE_RED_SECRET;

  if (!nodeRedUrl || !nodeRedSecret) {
    console.warn(
      "NODE_RED_URL or NODE_RED_SECRET not set – skipping notification",
    );
    return;
  }

  const url = nodeRedUrl.replace(/\/$/, "");
  const res = await fetch(`${url}/task`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": nodeRedSecret,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    throw new Error(`Node-RED returned ${res.status}`);
  }
}
