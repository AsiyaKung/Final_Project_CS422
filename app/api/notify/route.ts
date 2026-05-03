// POST /api/notify
// Internal endpoint – triggered by the backend (not directly by clients).
// Re-dispatches events to Node-RED. Can also be called by an ESP32 → Node-RED flow
// where Node-RED itself POSTs here with its secret header.
import { NextRequest } from "next/server";
import { rateLimit, getClientIp } from "@/lib/utils/rateLimit";
import { err, ok } from "@/lib/utils/apiResponse";

export async function POST(req: NextRequest) {
  // Validate shared secret – only known services may call this endpoint
  const secret = req.headers.get("X-Internal-Secret");
  if (!secret || secret !== process.env.NODE_RED_SECRET) {
    return err("Forbidden", 403);
  }

  const ip = getClientIp(req);
  if (!rateLimit(`notify:${ip}`, 60, 60_000))
    return err("Too many requests", 429);

  let payload;
  try {
    payload = await req.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  // Forward to Node-RED
  const nodeRedUrl = process.env.NODE_RED_URL;
  if (!nodeRedUrl) return err("Node-RED not configured", 503);

  const res = await fetch(`${nodeRedUrl}/task`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": process.env.NODE_RED_SECRET!,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return err(`Node-RED responded with ${res.status}`, 502);

  return ok({ forwarded: true });
}
