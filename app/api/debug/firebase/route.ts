// Temporary diagnostic endpoint – DELETE after debugging.
// Visit: /api/debug/firebase?secret=<DEBUG_SECRET> to check Firebase Admin status.
import { NextRequest } from "next/server";
import { ok, err } from "@/lib/utils/apiResponse";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.DEBUG_SECRET) {
    return err("Forbidden", 403);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;

  const diagnostics = {
    FIREBASE_PROJECT_ID: projectId ? `✅ set (${projectId})` : "❌ MISSING",
    FIREBASE_CLIENT_EMAIL: clientEmail
      ? `✅ set (${clientEmail})`
      : "❌ MISSING",
    FIREBASE_PRIVATE_KEY: rawKey
      ? `✅ set, length=${rawKey.length}, starts="${rawKey.slice(0, 27)}", ends="${rawKey.slice(-25)}"`
      : "❌ MISSING",
    FIREBASE_PRIVATE_KEY_has_literal_backslash_n: rawKey?.includes("\\n")
      ? "yes (raw \\n — .replace() will convert)"
      : "no (might have real newlines or be malformed)",
    FIREBASE_PRIVATE_KEY_has_real_newlines: rawKey?.includes("\n")
      ? "yes (real newlines present)"
      : "no",
  };

  // Try actually initializing Firebase Admin
  let adminStatus: string;
  try {
    const { getAdminDb } = await import("@/lib/firebase/admin");
    const db = getAdminDb();
    // Try a simple read to confirm connectivity
    await db.collection("_health").limit(1).get();
    adminStatus = "✅ Firebase Admin initialized and Firestore reachable";
  } catch (e) {
    adminStatus = `❌ ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  return ok({ diagnostics, adminStatus, timestamp: new Date().toISOString() });
}
