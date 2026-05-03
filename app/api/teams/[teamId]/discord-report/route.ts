// POST /api/teams/[teamId]/discord-report
// Sends a full task-status summary to the team's Discord webhook.
import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAuth, AuthError } from "@/lib/firebase/authServer";
import { rateLimit, getClientIp } from "@/lib/utils/rateLimit";
import { ok, err } from "@/lib/utils/apiResponse";

type RouteContext = { params: Promise<{ teamId: string }> };

interface TaskDoc {
  taskId: string;
  title: string;
  status: "pending" | "in_progress" | "done";
  assignedTo?: string | null;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { teamId } = await params;
  const ip = getClientIp(req);
  if (!rateLimit(`discord-report:${ip}`, 5, 60_000))
    return err("Too many requests — wait a minute before sending again", 429);

  // Auth
  let actor;
  try {
    actor = await requireAuth(req);
  } catch (e) {
    return e instanceof AuthError
      ? err(e.message, e.statusCode)
      : err("Unauthorized", 401);
  }

  const db = getAdminDb();

  // Verify membership
  const memberSnap = await db
    .collection("teamMembers")
    .where("teamId", "==", teamId)
    .where("userId", "==", actor.uid)
    .limit(1)
    .get();
  if (memberSnap.empty) return err("Not a member of this team", 403);

  // Get team (needs webhookUrl)
  const teamDoc = await db.collection("teams").doc(teamId).get();
  if (!teamDoc.exists) return err("Team not found", 404);
  const team = teamDoc.data()!;
  if (!team.webhookUrl) return err("This team has no Discord webhook set", 400);

  // Fetch all tasks for this team
  const taskSnap = await db
    .collection("tasks")
    .where("teamId", "==", teamId)
    .get();

  const tasks = taskSnap.docs.map((d) => d.data() as TaskDoc);

  const pending = tasks.filter((t) => t.status === "pending");
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const done = tasks.filter((t) => t.status === "done");
  const total = tasks.length;
  const pct = total === 0 ? 0 : Math.round((done.length / total) * 100);

  // Build Discord embed fields
  const formatList = (list: TaskDoc[]): string => {
    if (list.length === 0) return "_ไม่มีงาน_";
    return list
      .map((t) => `• **${t.title}**${t.assignedTo ? ` — ${t.assignedTo}` : ""}`)
      .join("\n")
      .slice(0, 1020); // Discord field value limit
  };

  // Progress bar visual (10 blocks)
  const filled = Math.round(pct / 10);
  const empty = 10 - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);

  const embed = {
    embeds: [
      {
        title: `📋 Task Summary — ${team.name}`,
        color: 0x39ff14, // neon green
        fields: [
          {
            name: `⏳ รอดำเนินการ (${pending.length})`,
            value: formatList(pending),
            inline: false,
          },
          {
            name: `🔄 กำลังดำเนินการ (${inProgress.length})`,
            value: formatList(inProgress),
            inline: false,
          },
          {
            name: `✅ เสร็จแล้ว (${done.length})`,
            value: formatList(done),
            inline: false,
          },
          {
            name: `📊 ความคืบหน้า`,
            value: `\`${bar}\` **${pct}%** (${done.length}/${total} งาน)`,
            inline: false,
          },
        ],
        footer: {
          text: `TaskFlow • ส่งโดย ${actor.name ?? actor.email ?? "ผู้ใช้"}`,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  // POST directly to Discord webhook
  const res = await fetch(team.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(embed),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[discord-report] webhook error:", res.status, text);
    return err(
      "Discord webhook returned an error — check the webhook URL",
      502,
    );
  }

  return ok({ sent: true, total, done: done.length, pct });
}
