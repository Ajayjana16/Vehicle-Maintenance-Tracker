import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const token = body?.token;
    const email = body?.email;

    let user = null;

    if (token && typeof token === "string") {
      user = await db.user.findFirst({
        where: { verificationToken: token },
      });
    }

    if (!user && email && typeof email === "string") {
      user = await db.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
    }

    if (!user) {
      // If neither token nor email, try current logged-in session
      const session = await getSession();
      if (session) {
        user = await db.user.findUnique({
          where: { id: session.userId },
        });
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification token." },
        { status: 400 }
      );
    }

    // Update user status
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        emailVerified: updatedUser.emailVerified,
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify email address. Please try again." },
      { status: 500 }
    );
  }
}
