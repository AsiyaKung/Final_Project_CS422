// POST /api/auth/resolve-username
// Looks up the email for a given username (display name) using the Admin SDK.
// This runs server-side, so Firestore security rules (require auth) are bypassed.
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username =
      typeof body?.username === "string" ? body.username.trim() : "";

    if (!username) {
      return NextResponse.json({ error: "username required" }, { status: 400 });
    }

    const snap = await getAdminDb()
      .collection("users")
      .where("name", "==", username)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { error: "No account found with that username." },
        { status: 404 },
      );
    }

    const email = snap.docs[0].data().email as string;
    if (!email) {
      return NextResponse.json(
        { error: "No account found with that username." },
        { status: 404 },
      );
    }

    return NextResponse.json({ email });
  } catch (err) {
    console.error("[resolve-username]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
