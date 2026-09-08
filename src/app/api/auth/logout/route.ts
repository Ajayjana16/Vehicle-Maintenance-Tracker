import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await clearSessionCookie();
    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  }
}
