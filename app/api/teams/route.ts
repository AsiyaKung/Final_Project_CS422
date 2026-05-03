// GET  /api/teams  – list teams for the authenticated user
// POST /api/teams  – create a new team
import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { customAlphabet } from "nanoid";

import { requireAuth, AuthError } from "@/lib/firebase/authServer";
import { getAdminDb } from "@/lib/firebase/admin";
import { createTeamSchema } from "@/lib/validations/schemas";
import { sanitizeObject } from "@/lib/utils/sanitize";
import { rateLimit, getClientIp } from "@/lib/utils/rateLimit";
import { ok, err } from "@/lib/utils/apiResponse";

// Invite codes: 8 uppercase alphanumeric chars
const genInviteCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

// ── GET ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  let actor;
  try {
    actor = await requireAuth(req);
  } catch (e) {
    return e instanceof AuthError
      ? err(e.message, e.statusCode)
      : err("Unauthorized", 401);
  }

  const db = getAdminDb();
  const memberships = await db
    .collection("teamMembers")
    .where("userId", "==", actor.uid)
    .get();

  const teamIds = memberships.docs.map((d) => d.data().teamId as string);
  if (teamIds.length === 0) return ok([]);

  const teamsSnap = await db
    .collection("teams")
    .where("teamId", "in", teamIds.slice(0, 30))
    .get();

  const teams = teamsSnap.docs.map((d) => {
    const data = d.data();
    // Strip webhook URL – never send to client
    const { webhookUrl: _w, ...safe } = data;
    return safe;
  });

  return ok(teams);
}

// ── POST ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(`teams:create:${ip}`, 10, 60_000))
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

  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.errors[0].message, 422);

  const input = sanitizeObject(parsed.data as Record<string, unknown>);
  // Restore webhookUrl as-is (sanitize would strip the URL – re-validate instead)
  input.webhookUrl = parsed.data.webhookUrl;

  const db = getAdminDb();
  const teamId = db.collection("teams").doc().id;
  const inviteCode = genInviteCode();
  const now = FieldValue.serverTimestamp();

  const batch = db.batch();

  batch.set(db.collection("teams").doc(teamId), {
    teamId,
    name: input.name,
    ownerId: actor.uid,
    webhookUrl: input.webhookUrl, // stored server-side only
    inviteCode,
    createdAt: now,
  });

  batch.set(db.collection("teamMembers").doc(`${teamId}_${actor.uid}`), {
    teamId,
    userId: actor.uid,
    role: "owner",
    joinedAt: now,
  });

  await batch.commit();

  return ok(
    {
      teamId,
      name: input.name,
      ownerId: actor.uid,
      inviteCode,
      createdAt: new Date().toISOString(),
    },
    201,
  );
}
