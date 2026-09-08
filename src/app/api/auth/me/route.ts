import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      const res = NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
      res.headers.set("Cache-Control", "no-store, max-age=0");
      return res;
    }

    // Fetch user record with select projection (no password hashes or reset tokens)
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        emailVerified: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null, error: "User not found" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      authenticated: true,
      user,
    });

    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("Error reading current user session:", error);
    return NextResponse.json(
      { authenticated: false, user: null, error: "Session verification error" },
      { status: 500 }
    );
  }
}
