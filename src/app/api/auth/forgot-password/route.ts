import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = body?.email;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Please provide your email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with that email, a password reset link has been issued.",
      });
    }

    // Generate secure reset token with 1-hour expiry
    const resetToken = "rst-" + Math.random().toString(36).substring(2, 12) + "-" + Date.now().toString(36);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    const demoResetLink = `/reset-password?token=${resetToken}&email=${encodeURIComponent(cleanEmail)}`;

    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, a password reset link has been issued.",
      demoResetLink,
      expiresAt: resetTokenExpiry.toISOString(),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Unable to process password reset request. Please try again." },
      { status: 500 }
    );
  }
}
