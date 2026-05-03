// Server-side helper: verify a Firebase ID token from the Authorization header.
// Usage in API routes: const user = await requireAuth(request);
import { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import type { DecodedIdToken } from "firebase-admin/auth";

export async function requireAuth(req: NextRequest): Promise<DecodedIdToken> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    throw new AuthError("Missing or malformed Authorization header", 401);
  }

  const idToken = authHeader.slice(7).trim();
  if (!idToken) {
    throw new AuthError("Empty token", 401);
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    return decoded;
  } catch {
    throw new AuthError("Invalid or expired token", 401);
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}
