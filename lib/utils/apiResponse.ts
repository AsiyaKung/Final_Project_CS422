// Shared helper to build consistent JSON API responses in Next.js route handlers.
import { NextResponse } from "next/server";
import type { ApiSuccess, ApiError } from "@/types";

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function err(
  message: string,
  status = 400,
  code?: string,
): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: message, code },
    { status },
  );
}
