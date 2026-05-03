// POST /api/teams/join  – join a team using an invite code
import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { requireAuth, AuthError } from "@/lib/firebase/authServer";
import { getAdminDb } from "@/lib/firebase/admin";
import { joinTeamSchema } from "@/lib/validations/schemas";
import { rateLimit, getClientIp } from "@/lib/utils/rateLimit";
import { ok, err } from "@/lib/utils/apiResponse";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(`teams:join:${ip}`, 10, 60_000))
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

  const parsed = joinTeamSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.errors[0].message, 422);

  const { inviteCode } = parsed.data;

  const db = getAdminDb();

  // Look up team by invite code
  const teamSnap = await db
    .collection("teams")
    .where("inviteCode", "==", inviteCode.toUpperCase())
    .limit(1)
    .get();

  if (teamSnap.empty) return err("Invalid invite code", 404);
  const teamDoc = teamSnap.docs[0];
  const team = teamDoc.data();
  const teamId = team.teamId as string;

  // Check if already a member
  const existing = await db
    .collection("teamMembers")
    .doc(`${teamId}_${actor.uid}`)
    .get();

  if (existing.exists) return err("You are already a member of this team", 409);

  await db.collection("teamMembers").doc(`${teamId}_${actor.uid}`).set({
    teamId,
    userId: actor.uid,
    role: "member",
    joinedAt: FieldValue.serverTimestamp(),
  });

  return ok(
    {
      teamId,
      name: team.name,
      ownerId: team.ownerId,
      inviteCode: team.inviteCode,
    },
    201,
  );
}
