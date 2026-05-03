// PATCH /api/teams/[teamId]/members/[userId] – owner only; changes a member's role
import { NextRequest } from "next/server";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAuth, AuthError } from "@/lib/firebase/authServer";
import { rateLimit, getClientIp } from "@/lib/utils/rateLimit";
import { ok, err } from "@/lib/utils/apiResponse";

type RouteContext = { params: Promise<{ teamId: string; userId: string }> };

const schema = z.object({
  role: z.enum(["admin", "member"]),
});

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { teamId, userId } = await params;
  const ip = getClientIp(req);
  if (!rateLimit(`members:role:${ip}`, 20, 60_000))
    return err("Too many requests", 429);

  let actor;
  try {
    actor = await requireAuth(req);
  } catch (e) {
    return e instanceof AuthError
      ? err(e.message, e.statusCode)
      : err("Unauthorized", 401);
  }

  // Parse body
  let body;
  try {
    body = schema.parse(await req.json());
  } catch {
    return err("Invalid body — role must be 'admin' or 'member'", 400);
  }

  const db = getAdminDb();

  // Verify actor is the team owner
  const teamSnap = await db.collection("teams").doc(teamId).get();
  if (!teamSnap.exists) return err("Team not found", 404);
  if (teamSnap.data()!.ownerId !== actor.uid)
    return err("Only the owner can change member roles", 403);

  // Cannot change owner's own role via this route
  if (userId === actor.uid) return err("Cannot change your own role", 400);

  // Find and update the member document
  const q = await db
    .collection("teamMembers")
    .where("teamId", "==", teamId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (q.empty) return err("Member not found", 404);

  await q.docs[0].ref.update({ role: body.role });

  return ok({ updated: true, role: body.role });
}
