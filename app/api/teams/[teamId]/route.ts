// DELETE /api/teams/[teamId] – owner only; deletes team + members + tasks
import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAuth, AuthError } from "@/lib/firebase/authServer";
import { rateLimit, getClientIp } from "@/lib/utils/rateLimit";
import { ok, err } from "@/lib/utils/apiResponse";

type RouteContext = { params: Promise<{ teamId: string }> };

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { teamId } = await params;
  const ip = getClientIp(req);
  if (!rateLimit(`teams:delete:${ip}`, 5, 60_000))
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
  const teamRef = db.collection("teams").doc(teamId);
  const teamSnap = await teamRef.get();

  if (!teamSnap.exists) return err("Team not found", 404);
  if (teamSnap.data()!.ownerId !== actor.uid)
    return err("Only the owner can delete a team", 403);

  // Delete all tasks + members in this team, then the team doc itself
  const [taskSnap, memberSnap] = await Promise.all([
    db.collection("tasks").where("teamId", "==", teamId).get(),
    db.collection("teamMembers").where("teamId", "==", teamId).get(),
  ]);

  await Promise.all([
    teamRef.delete(),
    ...taskSnap.docs.map((d) => d.ref.delete()),
    ...memberSnap.docs.map((d) => d.ref.delete()),
  ]);

  return ok({ deleted: true });
}
