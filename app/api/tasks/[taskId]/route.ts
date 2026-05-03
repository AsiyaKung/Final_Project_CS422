// PATCH /api/tasks/[taskId]  – update a task
// DELETE /api/tasks/[taskId] – delete a task
import { NextRequest } from "next/server";
import { after } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { requireAuth, AuthError } from "@/lib/firebase/authServer";
import { getAdminDb } from "@/lib/firebase/admin";
import { updateTaskSchema } from "@/lib/validations/schemas";
import { sanitizeObject } from "@/lib/utils/sanitize";
import { rateLimit, getClientIp } from "@/lib/utils/rateLimit";
import { ok, err } from "@/lib/utils/apiResponse";

type RouteContext = { params: Promise<{ taskId: string }> };

// ── PATCH ──────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { taskId } = await params;
    const ip = getClientIp(req);
    if (!rateLimit(`tasks:update:${ip}`, 60, 60_000))
      return err("Too many requests", 429);

    let actor;
    try {
      actor = await requireAuth(req);
    } catch (e) {
      return e instanceof AuthError
        ? err(e.message, e.statusCode)
        : err("Unauthorized", 401);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return err("Invalid JSON body", 400);
    }

    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message, 422);

    const db = getAdminDb();
    const taskRef = db.collection("tasks").doc(taskId);
    const taskSnap = await taskRef.get();

    if (!taskSnap.exists) return err("Task not found", 404);
    const task = taskSnap.data()!;

    // Verify caller is a team member
    const memberSnap = await db
      .collection("teamMembers")
      .where("teamId", "==", task.teamId)
      .where("userId", "==", actor.uid)
      .limit(1)
      .get();
    if (memberSnap.empty) return err("Forbidden", 403);

    const updates = sanitizeObject({ ...parsed.data } as Record<
      string,
      unknown
    >);
    await taskRef.update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // If task is being marked done, fire a Node-RED completion event
    if (parsed.data.status === "done") {
      const teamDoc = await db.collection("teams").doc(task.teamId).get();
      const team = teamDoc.data();
      if (team?.webhookUrl) {
        after(
          triggerNodeRed({
            event: "task_completed",
            taskId: taskId,
            taskTitle: task.title,
            teamId: task.teamId,
            teamName: team.name,
            actorName: actor.name ?? actor.email ?? "Someone",
            webhookUrl: team.webhookUrl,
            timestamp: new Date().toISOString(),
          }).catch((e) => console.error("[Node-RED notify error]", e)),
        );
      }
    }

    return ok({ updated: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[PATCH /api/tasks/:taskId]", msg);
    return err(`Internal server error: ${msg}`, 500);
  }
}

// ── DELETE ─────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { taskId } = await params;
    const ip = getClientIp(req);
    if (!rateLimit(`tasks:delete:${ip}`, 20, 60_000))
      return err("Too many requests", 429);

    let actor;
    try {
      actor = await requireAuth(req);
    } catch (e) {
      return e instanceof AuthError
        ? err(e.message, e.statusCode)
        : err("Unauthorized", 401);
    }

    const db = getAdminDb();
    const taskRef = db.collection("tasks").doc(taskId);
    const taskSnap = await taskRef.get();

    if (!taskSnap.exists) return err("Task not found", 404);
    const task = taskSnap.data()!;

    // Only the task creator or a team admin/owner may delete
    if (task.createdBy !== actor.uid) {
      const memberSnap = await db
        .collection("teamMembers")
        .where("teamId", "==", task.teamId)
        .where("userId", "==", actor.uid)
        .where("role", "in", ["owner", "admin"])
        .limit(1)
        .get();
      if (memberSnap.empty) return err("Forbidden", 403);
    }

    await taskRef.delete();
    return ok({ deleted: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[DELETE /api/tasks/:taskId]", msg);
    return err(`Internal server error: ${msg}`, 500);
  }
}

// ── Internal helper ────────────────────────────────────────────
async function triggerNodeRed(payload: object): Promise<void> {
  const nodeRedUrl = process.env.NODE_RED_URL;
  const nodeRedSecret = process.env.NODE_RED_SECRET;
  if (!nodeRedUrl || !nodeRedSecret) return;

  const url = nodeRedUrl.replace(/\/$/, "");
  await fetch(`${url}/task`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": nodeRedSecret,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000),
  });
}
