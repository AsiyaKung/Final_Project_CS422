import { NextRequest } from "next/server";
import { ok, err } from "@/lib/utils/apiResponse";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.DEBUG_SECRET) return err("Forbidden", 403);

  const results: Record<string, string> = {};

  try { await import("firebase-admin/firestore"); results.firestore_admin = "✅"; }
  catch (e) { results.firestore_admin = `❌ ${e}`; }

  try { await import("@/lib/firebase/admin"); results.firebase_admin_lib = "✅"; }
  catch (e) { results.firebase_admin_lib = `❌ ${e}`; }

  try { await import("@/lib/utils/rateLimit"); results.rateLimit = "✅"; }
  catch (e) { results.rateLimit = `❌ ${e}`; }

  try { await import("@/lib/utils/sanitize"); results.sanitize = "✅"; }
  catch (e) { results.sanitize = `❌ ${e}`; }

  try { await import("isomorphic-dompurify"); results.dompurify = "✅"; }
  catch (e) { results.dompurify = `❌ ${e}`; }

  try { await import("@/lib/validations/schemas"); results.schemas = "✅"; }
  catch (e) { results.schemas = `❌ ${e}`; }

  try { await import("@/lib/firebase/authServer"); results.authServer = "✅"; }
  catch (e) { results.authServer = `❌ ${e}`; }

  return ok(results);
}
